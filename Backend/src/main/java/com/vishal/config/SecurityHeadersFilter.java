package com.vishal.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public class SecurityHeadersFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Content Security Policy
        httpResponse.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';");

        // X-Frame-Options
        httpResponse.setHeader("X-Frame-Options", "DENY");

        // Strict-Transport-Security (HSTS)
        // Note: In production, you should also consider adding 'preload' and a max-age of at least 31536000 (1 year)
        httpResponse.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

        // Referrer-Policy
        httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // X-XSS-Protection
        httpResponse.setHeader("X-XSS-Protection", "1; mode=block");

        // Permissions-Policy (formerly Feature-Policy)
        httpResponse.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");

        chain.doFilter(request, response);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initialization code, if any
    }

    @Override
    public void destroy() {
        // Cleanup code, if any
    }
}