package com.vishal.exception;

/**
 * Exception thrown when a business rule is violated.
 */
public class BusinessException extends Exception {
    public BusinessException(String message) {
        super(message);
    }
}