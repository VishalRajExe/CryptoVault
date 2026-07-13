package com.vishal.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class IFSCValidator implements ConstraintValidator<IFSC, String> {

    private static final String IFSC_PATTERN = "^[A-Z]{4}0[A-Z0-9]{6}$";
    private Pattern pattern;

    @Override
    public void initialize(IFSC constraintAnnotation) {
        pattern = Pattern.compile(IFSC_PATTERN);
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