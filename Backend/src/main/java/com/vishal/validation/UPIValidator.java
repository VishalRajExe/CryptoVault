package com.vishal.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UPIValidator implements ConstraintValidator<UPI, String> {

    private static final String UPI_PATTERN = "^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$";
    private Pattern pattern;

    @Override
    public void initialize(UPI constraintAnnotation) {
        pattern = Pattern.compile(UPI_PATTERN);
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