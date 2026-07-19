package com.bjjeire.api.common;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.ReportAsSingleViolation;
import jakarta.validation.constraints.Pattern;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Constrains a value to the MongoDB ObjectId format (24 hexadecimal characters). Malformed IDs are rejected at the
 * controller boundary before they can reach a repository query.
 */
@Documented
@Constraint(validatedBy = {})
@Pattern(regexp = ValidObjectId.OBJECT_ID_PATTERN) @ReportAsSingleViolation
@Target({ElementType.PARAMETER, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidObjectId {
    String OBJECT_ID_PATTERN = "^[0-9a-fA-F]{24}$";

    String message() default "must be a 24-character hexadecimal ObjectId";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
