package com.bjjeire.api.competitor;

import com.bjjeire.api.common.ValidObjectId;
import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Gender;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.LocalDate;

/**
 * Creates or replaces the caller's own profile. Nationality, gender and belt may be left out while the competitor fills
 * the profile in; without them {@code profileComplete} is false and no sign-up is allowed.
 *
 * @param academy null for "no academy"
 * @param affiliation the wider team, optional; blank means none
 */
public record SaveCompetitorCommand(
        @NotBlank @Size(max = 60) String firstName,
        @Size(max = 60) String middleName,
        @NotBlank @Size(max = 60) String lastName,
        @IsoCountry String nationality,
        @NotNull @Past LocalDate dateOfBirth,
        Gender gender,
        Belt belt,
        @Valid AcademyChoice academy,
        @Size(max = 80) String affiliation,

        @Size(max = 30) @Pattern(regexp = PHONE_PATTERN, message = "must be a phone number") String phone,

        @Valid PostalAddress address) {
    /** Digits, spaces, brackets and hyphens, optionally after a leading plus. */
    public static final String PHONE_PATTERN = "^\\+?[0-9][0-9 ()-]{5,28}$";

    /**
     * The academy the competitor picked: a directory gym by id, or a typed name.
     *
     * @param gymId directory gym; when set, the stored name is the gym's and {@code name} is ignored
     * @param name the typed name, required when {@code gymId} is null
     */
    @NameOrGym
    public record AcademyChoice(
            @ValidObjectId String gymId, @Size(max = 80) String name) {}

    /** An academy needs a directory gym or a typed name. */
    @Documented
    @Constraint(validatedBy = NameOrGym.Validator.class)
    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface NameOrGym {
        String message() default "choose a gym from the directory or type an academy name";

        Class<?>[] groups() default {};

        Class<? extends Payload>[] payload() default {};

        /** Valid when the gym id is set or the name is not blank. */
        class Validator implements ConstraintValidator<NameOrGym, AcademyChoice> {
            @Override
            public boolean isValid(AcademyChoice value, ConstraintValidatorContext context) {
                if (value == null || value.gymId() != null) {
                    return true;
                }
                return value.name() != null && !value.name().isBlank();
            }
        }
    }
}
