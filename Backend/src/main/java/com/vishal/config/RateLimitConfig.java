package com.vishal.config;

import io.github.bucket4j.Bandwidth;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Configuration for rate limiting endpoints using Bucket4j.
 * Defines the bandwidth (rate limit) for each URL pattern.
 */
@Configuration
public class RateLimitConfig {

    /**
     * Returns a map of URL patterns to their respective bandwidth (rate limit).
     * The key is an Ant-style pattern that will be matched against the request path.
     * The value is the Bandwidth configuration.
     *
     * Example limits (adjust as needed):
     *   - login: 5 attempts per minute per IP
     *   - register: 3 attempts per minute per IP
     *   - otp verification: 10 attempts per minute per IP
     *   - withdraw: 10 requests per minute per IP (note: ideally per user, but using IP for simplicity)
     *   - trade: 30 requests per minute per IP
     *   - wallet: 20 requests per minute per IP
     *   - chatbot: 20 requests per minute per IP
     */
    @Bean
    Map<String, Bandwidth> endpointBandwidthMap() {
        Map<String, Bandwidth> map = new HashMap<>();

        // Login endpoint: 5 requests per minute per IP
        map.put("/auth/signin", Bandwidth.builder().capacity(5).refillGreedy(5, Duration.ofMinutes(1)).build());
        // Register endpoint: 3 requests per minute per IP
        map.put("/auth/signup", Bandwidth.builder().capacity(3).refillGreedy(3, Duration.ofMinutes(1)).build());
        // OTP verification endpoint: 10 per minute
        map.put("/auth/two-factor/otp/**", Bandwidth.builder().capacity(10).refillGreedy(10, Duration.ofMinutes(1)).build());
        // Withdrawal endpoint: 10 per minute (adjust path to match actual controller)
        map.put("/api/withdrawal/**", Bandwidth.builder().capacity(10).refillGreedy(10, Duration.ofMinutes(1)).build());
        // Trade endpoint: 30 per minute
        map.put("/api/orders/**", Bandwidth.builder().capacity(30).refillGreedy(30, Duration.ofMinutes(1)).build());
        // Wallet endpoint: 20 per minute
        map.put("/api/wallet/**", Bandwidth.builder().capacity(20).refillGreedy(20, Duration.ofMinutes(1)).build());
        // Chatbot endpoint: 20 per minute
        map.put("/api/chatbot/**", Bandwidth.builder().capacity(20).refillGreedy(20, Duration.ofMinutes(1)).build());
        return map;
    }
}