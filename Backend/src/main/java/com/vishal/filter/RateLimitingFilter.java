package com.vishal.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.PathMatcher;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servlet filter that applies rate limiting to specific endpoints using Bucket4j.
 * The filter checks the request path against predefined patterns and applies the corresponding rate limit.
 * If the limit is exceeded, it returns HTTP 429 (Too Many Requests).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitingFilter implements Filter {

    @Autowired
    private Map<String, Bandwidth> endpointBandwidthMap;

    private final ConcurrentHashMap<String, Bucket> bucketCache = new ConcurrentHashMap<>();
    private final PathMatcher pathMatcher = new AntPathMatcher();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        String clientIp = getClientIp(httpRequest);

        // Find the first matching pattern
        Bandwidth bandwidth = null;
        String matchedPattern = null;
        for (Map.Entry<String, Bandwidth> entry : endpointBandwidthMap.entrySet()) {
            String pattern = entry.getKey();
            if (pathMatcher.match(pattern, path)) {
                bandwidth = entry.getValue();
                matchedPattern = pattern;
                break;
            }
        }

        // If no matching pattern, continue without rate limiting
        if (bandwidth == null) {
            chain.doFilter(request, response);
            return;
        }

        // Create a cache key based on the pattern and client IP
        String cacheKey = matchedPattern + ":" + clientIp;

        // Get or create the bucket for this key
        final Bandwidth bw = bandwidth;
        Bucket bucket = bucketCache.computeIfAbsent(cacheKey, key ->
                Bucket.builder()
                        .addLimit(bw)
                        .build());

        // Try to consume one request
        if (bucket.tryConsume(1)) {
            // Request allowed, continue the chain
            chain.doFilter(request, response);
        } else {
            // Rate limit exceeded
            httpResponse.setStatus(429);
            httpResponse.setContentType("application/json");
            String json = "{\"error\": \"Too many requests. Please try again later.\"}";
            httpResponse.getWriter().write(json);
        }
    }

    /**
     * Extracts the client IP address from the request, considering common proxy headers.
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, the first is the client
            String[] ips = xForwardedFor.split(",");
            return ips[0].trim();
        }
        String xRealIP = request.getHeader("X-Remote-Addr");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        return request.getRemoteAddr();
    }
}