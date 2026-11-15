package com.bjjeire.api.tournament;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** A tournament venue: a name, an optional address, and optional coordinates that form a valid point. */
@Documented
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = VenueValidator.class)
public @interface ValidVenue {
    String message() default "Invalid venue.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
