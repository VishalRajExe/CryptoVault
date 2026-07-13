package com.vishal.util;

import org.jsoup.safety.Safelist;
import org.jsoup.Jsoup;

/**
 * Utility class for sanitizing HTML to prevent XSS attacks.
 * Uses JSoup library (already a transitive dependency of Spring Boot) for HTML sanitization.
 */
public final class HtmlSanitizer {

    private HtmlSanitizer() {
        // Prevent instantiation
    }

    /**
     * Sanitizes the input HTML by removing all tags and attributes,
     * leaving only plain text.
     *
     * @param input the input string that may contain HTML
     * @return sanitized plain text, or null if input is null
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        // Use Jsoup to clean HTML with a safelist that allows no tags
        return Jsoup.clean(input, Safelist.none());
    }
}