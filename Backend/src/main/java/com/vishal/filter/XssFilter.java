package com.vishal.filter;

import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Filter to prevent XSS attacks by sanitizing HTTP request parameters.
 * It removes HTML tags from all parameter values using Jsoup.
 * <p>
 * Note: This filter does not apply to multipart/form-data requests (file uploads) to avoid corrupting binary data.
 */
@Component
public class XssFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // Skip processing for multipart requests (file uploads) to avoid corrupting data
        if (isMultipart(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Wrap the request to override getParameter methods with sanitized values
        HttpServletRequest wrappedRequest = new XssHttpServletRequestWrapper(request);
        filterChain.doFilter(wrappedRequest, response);
    }

    /**
     * Checks if the request is a multipart/form-data (file upload) request.
     */
    private boolean isMultipart(HttpServletRequest request) {
        String contentType = request.getContentType();
        return contentType != null && contentType.toLowerCase().startsWith("multipart/");
    }

    /**
     * Wrapper for HttpServletRequest that sanitizes parameter values.
     */
    private static class XssHttpServletRequestWrapper extends HttpServletRequestWrapper {

        public XssHttpServletRequestWrapper(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String getParameter(String name) {
            String value = super.getParameter(name);
            return sanitize(value);
        }

        @Override
        public String[] getParameterValues(String name) {
            String[] values = super.getParameterValues(name);
            if (values == null) {
                return null;
            }

            int count = values.length;
            String[] sanitizedValues = new String[count];
            for (int i = 0; i < count; i++) {
                sanitizedValues[i] = sanitize(values[i]);
            }
            return sanitizedValues;
        }

        @Override
        public java.util.Map<String, String[]> getParameterMap() {
            Map<String, String[]> map = super.getParameterMap();
            Map<String, String[]> sanitizedMap = new HashMap<>(map.size());
            for (Map.Entry<String, String[]> entry : map.entrySet()) {
                String[] values = entry.getValue();
                if (values == null) {
                    sanitizedMap.put(entry.getKey(), null);
                    continue;
                }
                int count = values.length;
                String[] sanitizedValues = new String[count];
                for (int i = 0; i < count; i++) {
                    sanitizedValues[i] = sanitize(values[i]);
                }
                sanitizedMap.put(entry.getKey(), sanitizedValues);
            }
            return sanitizedMap;
        }

        /**
         * Sanitizes the input string by removing HTML tags.
         * Returns null if input is null.
         */
        private String sanitize(String value) {
            if (value == null) {
                return null;
            }
            // Use Jsoup to remove all HTML tags, leaving only text content.
            // This helps prevent XSS when the value is later output in HTML context.
            return org.jsoup.Jsoup.clean(value, Safelist.none());
        }
    }
}