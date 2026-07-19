package com.bjjeire.api.event;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class BjjEventDtoValidatorTest {
    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void openFactory() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeFactory() {
        factory.close();
    }

    @Test
    void validEventProducesNoViolations() {
        assertThat(validator.validate(validDto())).isEmpty();
    }

    @Test
    void invalidObjectIdIsRejected() {
        Set<ConstraintViolation<BjjEventDto>> violations = validator.validate(withId("not-an-id"));

        assertThat(violations)
                .anyMatch(v -> v.getPropertyPath().toString().equals("id")
                        && v.getMessage().equals("The provided ID is not in a valid format."));
    }

    @Test
    void nullIdIsRejected() {
        assertThat(validator.validate(withId(null)))
                .anyMatch(v -> v.getPropertyPath().toString().equals("id"));
    }

    @Test
    void duplicateTypesAreRejected() {
        BjjEventDto dto = withTypes(List.of(BjjEventType.Camp, BjjEventType.Camp));

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getMessage().equals("Event Types must not contain duplicates."));
    }

    @Test
    void emptyTypesAreRejected() {
        assertThat(validator.validate(withTypes(List.of())))
                .anyMatch(v -> v.getPropertyPath().toString().equals("types"));
    }

    @Test
    void freePricingWithCurrencyIsRejected() {
        BjjEventDto dto =
                withPricing(List.of(new PricingModel(PricingType.Free, null, null, BigDecimal.ZERO, null, "EUR")));

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getPropertyPath().toString().equals("pricingOptions[0].currency"));
    }

    @Test
    void freePricingWithNonZeroAmountIsRejected() {
        BjjEventDto dto =
                withPricing(List.of(new PricingModel(PricingType.Free, null, null, BigDecimal.TEN, null, null)));

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getPropertyPath().toString().equals("pricingOptions[0].amount"));
    }

    @Test
    void paidPricingRequiresPositiveAmountAndKnownCurrency() {
        BjjEventDto dto =
                withPricing(List.of(new PricingModel(PricingType.PerDay, null, null, BigDecimal.ZERO, null, "XXX")));

        Set<ConstraintViolation<BjjEventDto>> violations = validator.validate(dto);

        assertThat(violations)
                .anyMatch(v -> v.getPropertyPath().toString().equals("pricingOptions[0].amount"))
                .anyMatch(v -> v.getPropertyPath().toString().equals("pricingOptions[0].currency"));
    }

    @Test
    void flatRateWithoutDurationDaysIsRejected() {
        BjjEventDto dto = withPricing(
                List.of(new PricingModel(PricingType.FlatRate, null, null, new BigDecimal("275"), null, "EUR")));

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getPropertyPath().toString().equals("pricingOptions[0].durationDays"));
    }

    @Test
    void perSessionWithNonPositiveDurationDaysIsRejected() {
        BjjEventDto dto = withPricing(
                List.of(new PricingModel(PricingType.PerSession, null, null, new BigDecimal("20"), 0, "EUR")));

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getPropertyPath().toString().equals("pricingOptions[0].durationDays"));
    }

    @Test
    void pricingScopeReferencingUnknownTypeIsRejected() {
        BjjEventDto dto = withPricing(List.of(new PricingModel(
                PricingType.PerDay, null, List.of(BjjEventType.Seminar), new BigDecimal("110"), null, "EUR")));

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getMessage().equals("Pricing Options may only reference the event's own types."));
    }

    @Test
    void fixedDatesScheduleRequiresStartAndEndDates() {
        BjjEventDto dto = withSchedule(new BjjEventSchedule(ScheduleKind.FixedDates, null, null, List.of()));

        Set<ConstraintViolation<BjjEventDto>> violations = validator.validate(dto);

        assertThat(violations)
                .anyMatch(v -> v.getPropertyPath().toString().equals("schedule.startDate"))
                .anyMatch(v -> v.getPropertyPath().toString().equals("schedule.endDate"));
    }

    @Test
    void endDateBeforeStartDateIsRejected() {
        BjjEventDto dto = withSchedule(new BjjEventSchedule(
                ScheduleKind.FixedDates,
                Instant.parse("2026-07-27T00:00:00Z"),
                Instant.parse("2026-07-25T00:00:00Z"),
                List.of()));

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getPropertyPath().toString().equals("schedule.endDate"));
    }

    @Test
    void fixedDatesSessionWithDayIsRejected() {
        BjjEventDto dto = withSchedule(new BjjEventSchedule(
                ScheduleKind.FixedDates,
                Instant.parse("2026-07-25T00:00:00Z"),
                Instant.parse("2026-07-27T00:00:00Z"),
                List.of(new BjjEventSession(
                        null, WeekDay.Monday, LocalTime.of(10, 0), LocalTime.of(16, 0), null, null))));

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getMessage().equals("Fixed-date sessions must set Date and must not set Day."));
    }

    @Test
    void fixedDatesSessionOutsideScheduleRangeIsRejected() {
        BjjEventDto dto = withSchedule(new BjjEventSchedule(
                ScheduleKind.FixedDates,
                Instant.parse("2026-07-25T00:00:00Z"),
                Instant.parse("2026-07-27T00:00:00Z"),
                List.of(new BjjEventSession(
                        Instant.parse("2026-07-30T00:00:00Z"),
                        null,
                        LocalTime.of(10, 0),
                        LocalTime.of(16, 0),
                        null,
                        null))));

        assertThat(validator.validate(dto)).anyMatch(v -> v.getMessage()
                .equals("Session dates must fall within the schedule's start and end dates."));
    }

    @Test
    void weeklyRecurringScheduleRequiresSessionsWithDays() {
        BjjEventDto empty = withSchedule(new BjjEventSchedule(ScheduleKind.WeeklyRecurring, null, null, List.of()));
        BjjEventDto dated = withSchedule(new BjjEventSchedule(
                ScheduleKind.WeeklyRecurring,
                null,
                null,
                List.of(new BjjEventSession(
                        Instant.parse("2026-07-25T00:00:00Z"),
                        null,
                        LocalTime.of(10, 0),
                        LocalTime.of(16, 0),
                        null,
                        null))));

        assertThat(validator.validate(empty))
                .anyMatch(v -> v.getPropertyPath().toString().equals("schedule.sessions"));
        assertThat(validator.validate(dated))
                .anyMatch(v -> v.getMessage().equals("Weekly recurring sessions must set Day and must not set Date."));
    }

    @Test
    void sessionEndTimeMustBeAfterStartTime() {
        BjjEventDto dto = withSchedule(new BjjEventSchedule(
                ScheduleKind.FixedDates,
                Instant.parse("2026-07-25T00:00:00Z"),
                Instant.parse("2026-07-27T00:00:00Z"),
                List.of(new BjjEventSession(
                        Instant.parse("2026-07-25T00:00:00Z"),
                        null,
                        LocalTime.of(16, 0),
                        LocalTime.of(10, 0),
                        null,
                        null))));

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getPropertyPath().toString().equals("schedule.sessions[0].endTime"));
    }

    @Test
    void sessionScopeReferencingUnknownTypeIsRejected() {
        BjjEventDto dto = withSchedule(new BjjEventSchedule(
                ScheduleKind.FixedDates,
                Instant.parse("2026-07-25T00:00:00Z"),
                Instant.parse("2026-07-27T00:00:00Z"),
                List.of(new BjjEventSession(
                        Instant.parse("2026-07-25T00:00:00Z"),
                        null,
                        LocalTime.of(10, 0),
                        LocalTime.of(16, 0),
                        null,
                        List.of(BjjEventType.Seminar)))));

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getMessage().equals("Schedule sessions may only reference the event's own types."));
    }

    @Test
    void invalidEventUrlIsRejected() {
        BjjEventDto valid = validDto();
        BjjEventDto dto = new BjjEventDto(
                valid.id(),
                valid.name(),
                valid.description(),
                valid.types(),
                valid.organiser(),
                valid.status(),
                valid.statusReason(),
                valid.socialMedia(),
                valid.county(),
                valid.location(),
                valid.schedule(),
                valid.pricingOptions(),
                "notaurl",
                valid.imageUrl(),
                valid.isActive());

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getPropertyPath().toString().equals("eventUrl"));
    }

    @Test
    void organiserWithoutNameIsRejected() {
        BjjEventDto valid = validDto();
        BjjEventDto dto = new BjjEventDto(
                valid.id(),
                valid.name(),
                valid.description(),
                valid.types(),
                new Organizer("", "https://bjjeire.com"),
                valid.status(),
                valid.statusReason(),
                valid.socialMedia(),
                valid.county(),
                valid.location(),
                valid.schedule(),
                valid.pricingOptions(),
                valid.eventUrl(),
                valid.imageUrl(),
                valid.isActive());

        assertThat(validator.validate(dto))
                .anyMatch(v -> v.getPropertyPath().toString().equals("organiser.name"));
    }

    @Test
    void coordinatesOutsideValidRangesAreRejected() {
        BjjEventDto valid = validDto();
        Location badLocation = new Location(
                "1 Main Street", "Dublin Gym", new GeoCoordinates("Point", List.of(-200.0, 95.0), null, null));
        BjjEventDto dto = new BjjEventDto(
                valid.id(),
                valid.name(),
                valid.description(),
                valid.types(),
                valid.organiser(),
                valid.status(),
                valid.statusReason(),
                valid.socialMedia(),
                valid.county(),
                badLocation,
                valid.schedule(),
                valid.pricingOptions(),
                valid.eventUrl(),
                valid.imageUrl(),
                valid.isActive());

        Set<ConstraintViolation<BjjEventDto>> violations = validator.validate(dto);

        assertThat(violations)
                .anyMatch(v -> v.getMessage().equals("Longitude must be between -180 and 180 inclusive."))
                .anyMatch(v -> v.getMessage().equals("Latitude must be between -90 and 90 inclusive."));
    }

    private static BjjEventDto validDto() {
        return new BjjEventDto(
                "665624c1ad01ce465c6cf789",
                "Ground Game Camp",
                "Coach: Paulo Miyao",
                List.of(BjjEventType.Camp, BjjEventType.OpenMat),
                new Organizer("BJJ Eire", "https://bjjeire.com"),
                EventStatus.Upcoming,
                null,
                new SocialMedia(null, null, null, null),
                County.Clare,
                new Location(
                        "1 Main Street",
                        "Shannon Jiu-Jitsu Academy",
                        new GeoCoordinates("Point", List.of(-8.8770598, 52.716516), "Shannon", "test")),
                new BjjEventSchedule(
                        ScheduleKind.FixedDates,
                        Instant.parse("2026-07-25T00:00:00Z"),
                        Instant.parse("2026-07-27T00:00:00Z"),
                        List.of(new BjjEventSession(
                                Instant.parse("2026-07-25T00:00:00Z"),
                                null,
                                LocalTime.of(10, 0),
                                LocalTime.of(16, 0),
                                "Day 1",
                                List.of(BjjEventType.Camp)))),
                List.of(
                        new PricingModel(PricingType.Free, "Spectators", null, BigDecimal.ZERO, null, null),
                        new PricingModel(
                                PricingType.PerDay,
                                "Day pass",
                                List.of(BjjEventType.OpenMat),
                                new BigDecimal("110"),
                                null,
                                "EUR")),
                "https://groundgame.camp/",
                null,
                true);
    }

    private static BjjEventDto withId(String id) {
        BjjEventDto valid = validDto();
        return new BjjEventDto(
                id,
                valid.name(),
                valid.description(),
                valid.types(),
                valid.organiser(),
                valid.status(),
                valid.statusReason(),
                valid.socialMedia(),
                valid.county(),
                valid.location(),
                valid.schedule(),
                valid.pricingOptions(),
                valid.eventUrl(),
                valid.imageUrl(),
                valid.isActive());
    }

    private static BjjEventDto withTypes(List<BjjEventType> types) {
        BjjEventDto valid = validDto();
        return new BjjEventDto(
                valid.id(),
                valid.name(),
                valid.description(),
                types,
                valid.organiser(),
                valid.status(),
                valid.statusReason(),
                valid.socialMedia(),
                valid.county(),
                valid.location(),
                new BjjEventSchedule(
                        ScheduleKind.FixedDates,
                        Instant.parse("2026-07-25T00:00:00Z"),
                        Instant.parse("2026-07-27T00:00:00Z"),
                        List.of()),
                List.of(new PricingModel(PricingType.Free, null, null, BigDecimal.ZERO, null, null)),
                valid.eventUrl(),
                valid.imageUrl(),
                valid.isActive());
    }

    private static BjjEventDto withPricing(List<PricingModel> pricingOptions) {
        BjjEventDto valid = validDto();
        return new BjjEventDto(
                valid.id(),
                valid.name(),
                valid.description(),
                valid.types(),
                valid.organiser(),
                valid.status(),
                valid.statusReason(),
                valid.socialMedia(),
                valid.county(),
                valid.location(),
                valid.schedule(),
                pricingOptions,
                valid.eventUrl(),
                valid.imageUrl(),
                valid.isActive());
    }

    private static BjjEventDto withSchedule(BjjEventSchedule schedule) {
        BjjEventDto valid = validDto();
        return new BjjEventDto(
                valid.id(),
                valid.name(),
                valid.description(),
                valid.types(),
                valid.organiser(),
                valid.status(),
                valid.statusReason(),
                valid.socialMedia(),
                valid.county(),
                valid.location(),
                schedule,
                valid.pricingOptions(),
                valid.eventUrl(),
                valid.imageUrl(),
                valid.isActive());
    }
}
