package com.vishal.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator for Aadhaar number (India).
 * Uses Verhoeff algorithm for checksum validation.
 */
public class AadhaarValidator implements ConstraintValidator<Aadhaar, String> {

    // Verhoeff multiplication table
    private static final int[][] d = {
        {0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
        {1, 2, 3, 4, 0, 6, 7, 8, 9, 5},
        {2, 3, 4, 0, 1, 7, 8, 9, 5, 6},
        {3, 4, 0, 1, 2, 8, 9, 5, 6, 7},
        {4, 0, 1, 2, 3, 9, 5, 6, 7, 8},
        {5, 9, 8, 7, 6, 0, 4, 3, 2, 1},
        {6, 5, 9, 8, 7, 1, 0, 4, 3, 2},
        {7, 6, 5, 9, 8, 2, 1, 0, 4, 3},
        {8, 7, 6, 5, 9, 3, 2, 1, 0, 4},
        {9, 8, 7, 6, 5, 4, 3, 2, 1, 0}
    };

    // Verhoeff permutation table
    private static final int[][] p = {
        {0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
        {1, 5, 7, 6, 2, 8, 3, 0, 9, 4},
        {5, 8, 0, 3, 7, 9, 6, 1, 4, 2},
        {8, 9, 1, 6, 0, 4, 3, 5, 2, 7},
        {9, 4, 5, 3, 1, 2, 6, 8, 7, 0},
        {4, 2, 8, 6, 5, 7, 3, 9, 0, 1},
        {2, 7, 9, 3, 8, 0, 6, 4, 1, 5},
        {7, 0, 4, 6, 9, 1, 3, 2, 5, 8}
    };

    // Inverse table
    private static final int[] inv = {0, 4, 3, 2, 1, 5, 6, 7, 8, 9};

    @Override
    public void initialize(Aadhaar constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; // Let @NotNull handle null if needed
        }
        // Remove any spaces or hyphens if present
        String cleaned = value.replaceAll("[\\s-]", "");
        // Basic length and digit check (first digit 2-9, total 12 digits)
        if (!cleaned.matches("[2-9][0-9]{11}")) {
            return false;
        }
        // Verhoeff checksum
        return verhoeffChecksum(cleaned) == 0;
    }

    /**
     * Computes the Verhoeff checksum for a numeric string.
     * Returns 0 if the number is valid (checksum passes).
     */
    private int verhoeffChecksum(String num) {
        int c = 0;
        int[] rev = new int[num.length()];
        for (int i = 0; i < num.length(); i++) {
            rev[i] = Character.getNumericValue(num.charAt(i));
        }
        // Process from right to left
        for (int i = 0; i < rev.length; i++) {
            c = d[c][p[((i + 1) % 8)][rev[rev.length - 1 - i]]];
        }
        return c;
    }
}