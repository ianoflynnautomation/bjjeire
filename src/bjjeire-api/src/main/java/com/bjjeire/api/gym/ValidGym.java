package com.bjjeire.api.gym;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = GymDtoValidator.class)
public @interface ValidGym {
    String message() default "Invalid gym.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
