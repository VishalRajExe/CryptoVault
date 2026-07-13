package com.vishal.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = UPIValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface UPI {
    String message() default "Invalid UPI ID";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}