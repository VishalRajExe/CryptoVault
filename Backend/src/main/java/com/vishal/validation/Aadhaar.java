package com.vishal.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = AadhaarValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface Aadhaar {
    String message() default "Invalid Aadhaar number";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}