package com.vishal.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PANValidator implements ConstraintValidator<PAN, String> {

    private static final String PAN_PATTERN = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$";
    private Pattern pattern;

    @Override
    public void initialize(PAN constraintAnnotation) {
        pattern = Pattern.compile(PAN_PATTERN);
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return false;
        }
        Matcher matcher = pattern.matcher(value);
        return matcher.matches();
    }
}