package com.bjjeire.api.competitor;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.Locale;
import java.util.Set;

/** An ISO 3166-1 alpha-2 country code in upper case, such as {@code IE}. Null is allowed. */
@Documented
@Constraint(validatedBy = IsoCountry.Validator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface IsoCountry {
    String message() default "must be an ISO 3166-1 alpha-2 country code";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    /** Checks the code against the JDK's list of ISO 3166-1 alpha-2 codes. */
    class Validator implements ConstraintValidator<IsoCountry, String> {
        private static final Set<String> CODES = Locale.getISOCountries(Locale.IsoCountryCode.PART1_ALPHA2);

        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            return value == null || CODES.contains(value);
        }
    }
}
