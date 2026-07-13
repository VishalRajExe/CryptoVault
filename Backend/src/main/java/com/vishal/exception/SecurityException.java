package com.vishal.exception;

/**
 * Exception thrown for security-related issues.
 */
public class SecurityException extends RuntimeException {
    public SecurityException(String message) {
        super(message);
    }
}