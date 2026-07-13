package com.vishal.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PANValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface PAN {
    String message() default "Invalid PAN number";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}