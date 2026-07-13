package com.vishal.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Map;

/**
 * Fetches the live INR→USD exchange rate from the free ExchangeRate-API
 * (no API key required for the v4/latest endpoint) and caches the result
 * for one hour to avoid hammering the external service.
 *
 * Fallback: if the external call fails, a conservative hard-coded rate
 * (₹85 = $1) is used so deposits degrade gracefully rather than crashing.
 */
@Service
public class ExchangeRateService {

    // Cache duration: 1 hour in seconds
    private static final long CACHE_TTL_SECONDS = 3600L;

    // Safe fallback: ~₹85 per $1 as of mid-2025
    private static final BigDecimal FALLBACK_INR_PER_USD = BigDecimal.valueOf(85.0);

    private BigDecimal cachedRate = null;
    private Instant cacheExpiry = Instant.EPOCH;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Returns the number of USD per 1 INR (e.g. ~0.01176 when ₹85 = $1).
     * Result is cached for {@code CACHE_TTL_SECONDS} seconds.
     */
    public synchronized BigDecimal getInrToUsdRate() {
        if (cachedRate != null && Instant.now().isBefore(cacheExpiry)) {
            return cachedRate;
        }
        try {
            // ExchangeRate-API free tier: no key, returns rates relative to base currency
            String url = "https://api.exchangerate-api.com/v4/latest/USD";
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("rates")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> rates = (Map<String, Object>) response.get("rates");
                Object inrRateObj = rates.get("INR");
                if (inrRateObj != null) {
                    // rates["INR"] = INR per 1 USD  →  inverted = USD per 1 INR
                    double inrPerUsd = ((Number) inrRateObj).doubleValue();
                    BigDecimal inrPerUsdBd = BigDecimal.valueOf(inrPerUsd);
                    // 1 INR = 1/inrPerUsd USD
                    BigDecimal usdPerInr = BigDecimal.ONE.divide(inrPerUsdBd, 8, RoundingMode.HALF_UP);
                    cachedRate = usdPerInr;
                    cacheExpiry = Instant.now().plusSeconds(CACHE_TTL_SECONDS);
                    return cachedRate;
                }
            }
        } catch (Exception e) {
            // Log but don't crash – fall through to the fallback
            System.err.println("[ExchangeRateService] Failed to fetch live rate: " + e.getMessage());
        }
        // Fallback: return a conservative hard-coded rate
        return BigDecimal.ONE.divide(FALLBACK_INR_PER_USD, 8, RoundingMode.HALF_UP);
    }

    /**
     * Converts an INR amount to its USD equivalent, rounded to 2 decimal places.
     * Example: convertInrToUsd(10000) at ₹85/$1 → $117.65
     */
    public BigDecimal convertInrToUsd(long inrAmount) {
        BigDecimal inrToUsd = getInrToUsdRate();
        return BigDecimal.valueOf(inrAmount)
                .multiply(inrToUsd)
                .setScale(2, RoundingMode.HALF_UP);
    }
}
