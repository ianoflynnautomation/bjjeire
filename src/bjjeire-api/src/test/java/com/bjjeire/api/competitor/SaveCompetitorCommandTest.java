package com.bjjeire.api.competitor;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Gender;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.time.LocalDate;
import java.util.Set;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** The profile rules a save must meet (T044, data-model.md § Competitor). */
class SaveCompetitorCommandTest {
    private static jakarta.validation.ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        factory.close();
    }

    @Test
    @Tag("#5007")
    void shouldAcceptAFullProfile() {
        assertThat(validator.validate(valid())).isEmpty();
    }

    @Test
    @Tag("#5008")
    void shouldAcceptNoAcademyAndNoAffiliation() {
        assertThat(violations(command -> with(command, null, null))).isEmpty();
    }

    @Test
    void shouldRequireFirstNameLastNameAndDateOfBirth() {
        SaveCompetitorCommand empty =
                new SaveCompetitorCommand(" ", null, "", null, null, null, null, null, null, null, null);

        assertThat(fields(validator.validate(empty))).contains("firstName", "lastName", "dateOfBirth");
    }

    @Test
    void shouldLimitNamesToSixtyCharactersAndTeamsToEighty() {
        String sixtyOne = "a".repeat(61);
        String eightyOne = "a".repeat(81);
        SaveCompetitorCommand tooLong = new SaveCompetitorCommand(
                sixtyOne,
                sixtyOne,
                sixtyOne,
                "IE",
                LocalDate.of(1990, 4, 12),
                Gender.FEMALE,
                Belt.BLUE,
                new SaveCompetitorCommand.AcademyChoice(null, eightyOne),
                eightyOne,
                null,
                null);

        assertThat(fields(validator.validate(tooLong)))
                .containsExactlyInAnyOrder("firstName", "middleName", "lastName", "academy.name", "affiliation");
        assertThat(violations(command -> new SaveCompetitorCommand(
                        "a".repeat(60),
                        "a".repeat(60),
                        "a".repeat(60),
                        "IE",
                        command.dateOfBirth(),
                        command.gender(),
                        command.belt(),
                        new SaveCompetitorCommand.AcademyChoice(null, "a".repeat(80)),
                        "a".repeat(80),
                        null,
                        null)))
                .isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"ie", "IRL", "XX", "I", "Ireland"})
    void shouldRequireAnIsoAlpha2Nationality(String nationality) {
        Set<String> fields = fields(validator.validate(new SaveCompetitorCommand(
                "Aoife",
                null,
                "Byrne",
                nationality,
                LocalDate.of(1990, 4, 12),
                Gender.FEMALE,
                Belt.BLUE,
                null,
                null,
                null,
                null)));

        assertThat(fields).containsExactly("nationality");
    }

    @Test
    void shouldRequireADateOfBirthInThePast() {
        SaveCompetitorCommand future = new SaveCompetitorCommand(
                "Aoife",
                null,
                "Byrne",
                "IE",
                LocalDate.now().plusDays(1),
                Gender.FEMALE,
                Belt.BLUE,
                null,
                null,
                null,
                null);

        assertThat(fields(validator.validate(future))).containsExactly("dateOfBirth");
    }

    @Test
    @Tag("#5008")
    void shouldNeedAnAcademyNameOrADirectoryGym() {
        assertThat(fields(validator.validate(with(valid(), new SaveCompetitorCommand.AcademyChoice(null, " "), null))))
                .containsExactly("academy");
        assertThat(fields(validator.validate(
                        with(valid(), new SaveCompetitorCommand.AcademyChoice("not-an-object-id", null), null))))
                .containsExactly("academy.gymId");
        assertThat(validator.validate(
                        with(valid(), new SaveCompetitorCommand.AcademyChoice("665624c1ad01ce465c6cf456", null), null)))
                .isEmpty();
    }

    @Test
    void shouldCheckTheOptionalPhoneAndAddress() {
        SaveCompetitorCommand bad = new SaveCompetitorCommand(
                "Aoife",
                null,
                "Byrne",
                "IE",
                LocalDate.of(1990, 4, 12),
                Gender.FEMALE,
                Belt.BLUE,
                null,
                null,
                "call me",
                new PostalAddress("a".repeat(201), "a".repeat(21), "a".repeat(101), "a".repeat(101), "Eire"));

        assertThat(fields(validator.validate(bad)))
                .containsExactlyInAnyOrder(
                        "phone",
                        "address.street",
                        "address.postcode",
                        "address.city",
                        "address.region",
                        "address.country");
    }

    @Test
    @Tag("#5007")
    void shouldCallAProfileCompleteOnlyWithNamesNationalityDateOfBirthGenderAndBelt() {
        Competitor complete = Competitor.builder()
                .firstName("Aoife")
                .lastName("Byrne")
                .nationality("IE")
                .dateOfBirth(LocalDate.of(1990, 4, 12))
                .gender(Gender.FEMALE)
                .belt(Belt.BLUE)
                .build();

        assertThat(complete.isProfileComplete()).isTrue();
        assertThat(copy(complete).nationality(null).build().isProfileComplete()).isFalse();
        assertThat(copy(complete).gender(null).build().isProfileComplete()).isFalse();
        assertThat(copy(complete).belt(null).build().isProfileComplete()).isFalse();
        assertThat(copy(complete).dateOfBirth(null).build().isProfileComplete()).isFalse();
        assertThat(copy(complete).firstName(" ").build().isProfileComplete()).isFalse();
        assertThat(copy(complete).lastName(null).build().isProfileComplete()).isFalse();
    }

    private static Competitor.CompetitorBuilder copy(Competitor competitor) {
        return competitor.toBuilder();
    }

    private static SaveCompetitorCommand valid() {
        return new SaveCompetitorCommand(
                "Aoife",
                "Máire",
                "Byrne",
                "IE",
                LocalDate.of(1990, 4, 12),
                Gender.FEMALE,
                Belt.BLUE,
                new SaveCompetitorCommand.AcademyChoice(null, "Team X"),
                "Alliance",
                "+353 87 123 4567",
                new PostalAddress("1 Main Street", "D01 X2Y3", "Dublin", "Dublin", "IE"));
    }

    private static SaveCompetitorCommand with(
            SaveCompetitorCommand command, SaveCompetitorCommand.AcademyChoice academy, String affiliation) {
        return new SaveCompetitorCommand(
                command.firstName(),
                command.middleName(),
                command.lastName(),
                command.nationality(),
                command.dateOfBirth(),
                command.gender(),
                command.belt(),
                academy,
                affiliation,
                command.phone(),
                command.address());
    }

    private static Set<ConstraintViolation<SaveCompetitorCommand>> violations(
            UnaryOperator<SaveCompetitorCommand> change) {
        return validator.validate(change.apply(valid()));
    }

    private static Set<String> fields(Set<ConstraintViolation<SaveCompetitorCommand>> violations) {
        return violations.stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(Collectors.toSet());
    }
}
