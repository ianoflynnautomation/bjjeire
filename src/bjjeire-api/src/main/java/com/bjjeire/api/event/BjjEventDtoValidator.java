package com.bjjeire.api.event;

import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import org.hibernate.validator.constraintvalidation.HibernateConstraintValidatorContext;

public class BjjEventDtoValidator implements ConstraintValidator<ValidBjjEvent, BjjEventDto> {
    public static final String CODE_REQUIRED = "FIELD_REQUIRED";
    public static final String CODE_MAX_LENGTH = "MAX_LENGTH_EXCEEDED";
    public static final String CODE_INVALID_ENUM = "INVALID_ENUM";
    public static final String CODE_INVALID_URL = "INVALID_URL";
    public static final String CODE_NOT_NULL = "NOT_NULL";
    public static final String CODE_NO_NULL_ENTRIES = "NO_NULL_ENTRIES";
    public static final String CODE_CONDITIONAL_REQUIRED = "CONDITIONAL_FIELD_REQUIRED";
    public static final String CODE_GREATER_THAN = "GREATER_THAN";
    public static final String CODE_GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL";
    public static final String CODE_POSITIVE_OR_NULL = "POSITIVE_OR_NULL";
    public static final String CODE_INVALID_FORMAT = "INVALID_FORMAT";
    public static final String CODE_MUST_BE_NULL = "MUST_BE_NULL";
    public static final String CODE_INCLUSIVE_BETWEEN = "INCLUSIVE_BETWEEN_VALUE";
    public static final String CODE_PREDICATE = "PredicateValidator";

    private static final Pattern OBJECT_ID = Pattern.compile("^[0-9a-fA-F]{24}$");
    private static final Set<String> VALID_CURRENCIES =
            Set.of("EUR", "USD", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL");

    @Override
    public boolean isValid(BjjEventDto dto, ConstraintValidatorContext context) {
        if (dto == null) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        Violations violations = new Violations(context);

        if (dto.id() != null
                && !dto.id().isBlank()
                && !OBJECT_ID.matcher(dto.id()).matches()) {
            violations.add("id", "The provided ID is not in a valid format.", CODE_PREDICATE);
        }

        requireString(dto.name(), 100, "name", "Event Name", violations);
        maxLength(dto.description(), 200, "description", "Description", violations);
        validateTypes(dto.types(), violations);
        requireNotNull(dto.organiser(), "organiser", "Organiser", violations);
        validateOrganiser(dto.organiser(), violations);
        if (dto.status() == null) {
            violations.add("status", "Invalid Event Status.", CODE_INVALID_ENUM);
        }
        maxLength(dto.statusReason(), 100, "statusReason", "Status Reason", violations);
        requireNotNull(dto.socialMedia(), "socialMedia", "Social Media", violations);
        validateSocialMedia(dto.socialMedia(), violations);
        if (dto.county() == null) {
            violations.add("county", "Invalid County.", CODE_INVALID_ENUM);
        }
        requireNotNull(dto.location(), "location", "Location", violations);
        validateLocation(dto.location(), violations);
        requireNotNull(dto.schedule(), "schedule", "Schedule", violations);
        validateSchedule(dto.schedule(), violations);
        validatePricingOptions(dto.pricingOptions(), violations);
        validateScopes(dto, violations);
        validateUrl(dto.eventUrl(), "eventUrl", "Event URL", violations);
        validateUrl(dto.imageUrl(), "imageUrl", "Image URL", violations);

        return violations.isEmpty();
    }

    private static void validateTypes(List<BjjEventType> types, Violations violations) {
        if (types == null || types.isEmpty()) {
            violations.add("types", "At least one Event Type is required.", "EVENT_TYPES_REQUIRED");
            return;
        }
        if (types.stream().distinct().count() != types.size()) {
            violations.add("types", "Event Types must not contain duplicates.", "EVENT_TYPES_DUPLICATED");
        }
        if (containsNull(types)) {
            violations.add("types", "Event Types cannot contain null entries.", CODE_NO_NULL_ENTRIES);
        }
    }

    private static void validateOrganiser(Organizer organiser, Violations violations) {
        if (organiser == null) {
            return;
        }
        requireString(organiser.name(), 100, "organiser.name", "Name", violations);
        validateUrl(organiser.website(), "organiser.website", "Website", violations);
    }

    private static void validateSocialMedia(SocialMedia socialMedia, Violations violations) {
        if (socialMedia == null) {
            return;
        }
        validateUrl(socialMedia.facebook(), "socialMedia.facebook", "Facebook", violations);
        validateUrl(socialMedia.instagram(), "socialMedia.instagram", "Instagram", violations);
        validateUrl(socialMedia.x(), "socialMedia.x", "X", violations);
        validateUrl(socialMedia.youTube(), "socialMedia.youTube", "YouTube", violations);
    }

    private static void validateLocation(Location location, Violations violations) {
        if (location == null) {
            return;
        }
        requireString(location.address(), 100, "location.address", "Address", violations);
        requireString(location.venue(), 100, "location.venue", "Venue", violations);
        if (location.coordinates() == null) {
            violations.add("location.coordinates", "Coordinates cannot be null.", CODE_NOT_NULL);
            return;
        }
        validateCoordinates(location.coordinates(), violations);
    }

    private static void validateCoordinates(GeoCoordinates coordinates, Violations violations) {
        requireString(coordinates.type(), 50, "location.coordinates.type", "Type", violations);
        List<Double> values = coordinates.coordinates();
        if (values == null || values.size() != 2 || containsNull(values)) {
            violations.add(
                    "location.coordinates.coordinates",
                    "Coordinates must be a [longitude, latitude] pair.",
                    CODE_PREDICATE);
        } else {
            double longitude = values.get(0);
            double latitude = values.get(1);
            if (longitude < -180.0 || longitude > 180.0) {
                violations.add(
                        "location.coordinates.longitude",
                        "Longitude must be between -180 and 180 inclusive.",
                        CODE_INCLUSIVE_BETWEEN);
            }
            if (latitude < -90.0 || latitude > 90.0) {
                violations.add(
                        "location.coordinates.latitude",
                        "Latitude must be between -90 and 90 inclusive.",
                        CODE_INCLUSIVE_BETWEEN);
            }
        }
        maxLength(coordinates.placeName(), 100, "location.coordinates.placeName", "Place Name", violations);
        maxLength(coordinates.placeId(), 24, "location.coordinates.placeId", "Place ID", violations);
    }

    private static void validateSchedule(BjjEventSchedule schedule, Violations violations) {
        if (schedule == null) {
            return;
        }

        if (schedule.kind() == null) {
            violations.add("schedule.kind", "Invalid Schedule Kind.", CODE_INVALID_ENUM);
        }

        if (schedule.startDate() != null
                && schedule.endDate() != null
                && schedule.endDate().isBefore(schedule.startDate())) {
            violations.add("schedule.endDate", "End Date must be on or after Start Date.", CODE_GREATER_THAN_OR_EQUAL);
        }

        List<BjjEventSession> sessions = schedule.sessions();
        if (sessions == null) {
            violations.add("schedule.sessions", "Sessions cannot be null.", CODE_NOT_NULL);
            return;
        }
        if (containsNull(sessions)) {
            violations.add("schedule.sessions", "Sessions cannot contain null entries.", CODE_NO_NULL_ENTRIES);
            return;
        }

        for (int i = 0; i < sessions.size(); i++) {
            validateSession(sessions.get(i), "schedule.sessions[" + i + "]", violations);
        }

        if (schedule.kind() == ScheduleKind.FixedDates) {
            validateFixedDatesRules(schedule, sessions, violations);
        }
        if (schedule.kind() == ScheduleKind.WeeklyRecurring) {
            validateWeeklyRecurringRules(sessions, violations);
        }
    }

    private static void validateFixedDatesRules(
            BjjEventSchedule schedule, List<BjjEventSession> sessions, Violations violations) {
        if (schedule.startDate() == null) {
            violations.add(
                    "schedule.startDate",
                    "Start Date is required when the schedule has fixed dates.",
                    CODE_CONDITIONAL_REQUIRED);
        }
        if (schedule.endDate() == null) {
            violations.add(
                    "schedule.endDate",
                    "End Date is required when the schedule has fixed dates.",
                    CODE_CONDITIONAL_REQUIRED);
        }
        if (!sessions.stream().allMatch(s -> s.date() != null && s.day() == null)) {
            violations.add(
                    "schedule.sessions",
                    "Fixed-date sessions must set Date and must not set Day.",
                    "SESSION_DATE_REQUIRED_FOR_FIXED_DATES");
        }
        if (!sessions.stream().allMatch(s -> sessionDateInRange(s, schedule))) {
            violations.add(
                    "schedule.sessions",
                    "Session dates must fall within the schedule's start and end dates.",
                    "SESSION_DATE_OUT_OF_RANGE");
        }
    }

    private static boolean sessionDateInRange(BjjEventSession session, BjjEventSchedule schedule) {
        if (session.date() == null) {
            return true;
        }
        Instant day = session.date().truncatedTo(ChronoUnit.DAYS);
        boolean afterStart = schedule.startDate() == null
                || !day.isBefore(schedule.startDate().truncatedTo(ChronoUnit.DAYS));
        boolean beforeEnd =
                schedule.endDate() == null || !day.isAfter(schedule.endDate().truncatedTo(ChronoUnit.DAYS));
        return afterStart && beforeEnd;
    }

    private static void validateWeeklyRecurringRules(List<BjjEventSession> sessions, Violations violations) {
        if (sessions.isEmpty()) {
            violations.add("schedule.sessions", "Sessions is required.", CODE_REQUIRED);
        }
        if (!sessions.stream().allMatch(s -> s.day() != null && s.date() == null)) {
            violations.add(
                    "schedule.sessions",
                    "Weekly recurring sessions must set Day and must not set Date.",
                    "SESSION_DAY_REQUIRED_FOR_WEEKLY");
        }
    }

    private static void validateSession(BjjEventSession session, String path, Violations violations) {
        if (session.startTime() == null) {
            violations.add(path + ".startTime", "Start Time is required.", CODE_REQUIRED);
        }
        if (session.endTime() == null) {
            violations.add(path + ".endTime", "End Time is required.", CODE_REQUIRED);
        }
        if (session.startTime() != null
                && session.endTime() != null
                && !session.endTime().isAfter(session.startTime())) {
            violations.add(path + ".endTime", "End Time must be greater than Start Time.", CODE_GREATER_THAN);
        }
        maxLength(session.title(), 100, path + ".title", "Session Title", violations);
        if (session.types() != null && containsNull(session.types())) {
            violations.add(path + ".types", "Session Types cannot contain null entries.", CODE_NO_NULL_ENTRIES);
        }
    }

    private static void validatePricingOptions(List<PricingModel> pricingOptions, Violations violations) {
        if (pricingOptions == null || pricingOptions.isEmpty()) {
            violations.add("pricingOptions", "At least one Pricing Option is required.", "PRICING_OPTIONS_REQUIRED");
            return;
        }
        if (containsNull(pricingOptions)) {
            violations.add("pricingOptions", "Pricing Options cannot contain null entries.", CODE_NO_NULL_ENTRIES);
            return;
        }
        for (int i = 0; i < pricingOptions.size(); i++) {
            validatePricingOption(pricingOptions.get(i), "pricingOptions[" + i + "]", violations);
        }
    }

    private static void validatePricingOption(PricingModel option, String path, Violations violations) {
        if (option.type() == null) {
            violations.add(path + ".type", "Invalid Pricing Type.", CODE_INVALID_ENUM);
            return;
        }

        maxLength(option.label(), 50, path + ".label", "Pricing Label", violations);
        if (option.appliesToTypes() != null && containsNull(option.appliesToTypes())) {
            violations.add(
                    path + ".appliesToTypes", "Applies To Types cannot contain null entries.", CODE_NO_NULL_ENTRIES);
        }

        if (option.type() == PricingType.Free) {
            validateFreePricing(option, path, violations);
        } else {
            validatePaidPricing(option, path, violations);
        }
        validatePricingDuration(option, path, violations);
    }

    private static void validateFreePricing(PricingModel option, String path, Violations violations) {
        BigDecimal amount = option.amount() != null ? option.amount() : BigDecimal.ZERO;
        if (amount.compareTo(BigDecimal.ZERO) != 0) {
            violations.add(path + ".amount", "Amount must be 0 when Pricing Type is Free.", "MUST_BE_ZERO_WHEN_FREE");
        }
        if (option.currency() != null) {
            violations.add(path + ".currency", "Currency must be null when Pricing Type is Free.", CODE_MUST_BE_NULL);
        }
        if (option.durationDays() != null) {
            violations.add(
                    path + ".durationDays", "Duration Days must be null when Pricing Type is Free.", CODE_MUST_BE_NULL);
        }
    }

    private static void validatePaidPricing(PricingModel option, String path, Violations violations) {
        BigDecimal amount = option.amount() != null ? option.amount() : BigDecimal.ZERO;
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            violations.add(path + ".amount", "Amount must be greater than 0.", "MUST_BE_POSITIVE_FOR_PAID");
        }
        if (option.currency() == null || option.currency().isBlank()) {
            violations.add(path + ".currency", "Currency is required.", CODE_REQUIRED);
        } else if (!VALID_CURRENCIES.contains(option.currency())) {
            violations.add(
                    path + ".currency",
                    "Currency must be a valid ISO 4217 currency code (e.g., EUR, USD).",
                    CODE_INVALID_FORMAT);
        }
    }

    private static void validatePricingDuration(PricingModel option, String path, Violations violations) {
        if (option.type() == PricingType.FlatRate) {
            if (option.durationDays() == null) {
                violations.add(
                        path + ".durationDays",
                        "Duration Days is required when FlatRate pricing type.",
                        CODE_CONDITIONAL_REQUIRED);
            } else if (option.durationDays() <= 0) {
                violations.add(
                        path + ".durationDays",
                        "Duration Days must be greater than 0.",
                        "MUST_BE_POSITIVE_FLAT_RATE_DURATION");
            }
        }

        if ((option.type() == PricingType.PerSession || option.type() == PricingType.PerDay)
                && option.durationDays() != null
                && option.durationDays() <= 0) {
            violations.add(
                    path + ".durationDays",
                    "Duration Days must be null or positive when provided for PerSession or PerDay pricing.",
                    CODE_POSITIVE_OR_NULL);
        }
    }

    private static void validateScopes(BjjEventDto dto, Violations violations) {
        List<BjjEventType> types = dto.types();
        if (types == null) {
            return;
        }

        if (!pricingScopeValid(dto, types)) {
            violations.add(
                    "pricingOptions",
                    "Pricing Options may only reference the event's own types.",
                    "PRICING_SCOPE_UNKNOWN_TYPE");
        }

        if (!sessionScopeValid(dto, types)) {
            violations.add(
                    "schedule.sessions",
                    "Schedule sessions may only reference the event's own types.",
                    "SESSION_SCOPE_UNKNOWN_TYPE");
        }
    }

    private static boolean pricingScopeValid(BjjEventDto dto, List<BjjEventType> types) {
        return dto.pricingOptions() == null
                || dto.pricingOptions().stream()
                        .allMatch(p -> p == null
                                || p.appliesToTypes() == null
                                || p.appliesToTypes().stream().allMatch(t -> t != null && types.contains(t)));
    }

    private static boolean sessionScopeValid(BjjEventDto dto, List<BjjEventType> types) {
        return dto.schedule() == null
                || dto.schedule().sessions() == null
                || dto.schedule().sessions().stream()
                        .allMatch(s -> s == null
                                || s.types() == null
                                || s.types().stream().allMatch(t -> t != null && types.contains(t)));
    }

    private static boolean containsNull(List<?> values) {
        return values.stream().anyMatch(Objects::isNull);
    }

    private static void requireNotNull(Object value, String path, String name, Violations violations) {
        if (value == null) {
            violations.add(path, name + " cannot be null.", CODE_NOT_NULL);
        }
    }

    private static void requireString(String value, int maxLength, String path, String name, Violations violations) {
        if (value == null || value.isBlank()) {
            violations.add(path, name + " is required.", CODE_REQUIRED);
        } else if (value.length() > maxLength) {
            violations.add(path, name + " cannot exceed " + maxLength + " characters.", CODE_MAX_LENGTH);
        }
    }

    private static void maxLength(String value, int maxLength, String path, String name, Violations violations) {
        if (value != null && value.length() > maxLength) {
            violations.add(path, name + " cannot exceed " + maxLength + " characters.", CODE_MAX_LENGTH);
        }
    }

    private static void validateUrl(String url, String path, String name, Violations violations) {
        if (url == null || url.isBlank()) {
            return;
        }
        if (!isValidHttpUrl(url)) {
            violations.add(path, name + " must be a valid URL.", CODE_INVALID_URL);
        }
    }

    private static boolean isValidHttpUrl(String url) {
        try {
            URI uri = URI.create(url);
            return uri.isAbsolute()
                    && ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null
                    && !uri.getHost().isBlank();
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static final class Violations {
        private final ConstraintValidatorContext context;
        private final Set<String> reported = new HashSet<>();

        private Violations(ConstraintValidatorContext context) {
            this.context = context;
        }

        private void add(String path, String message, String errorCode) {
            if (!reported.add(path + "|" + message)) {
                return;
            }
            context.unwrap(HibernateConstraintValidatorContext.class)
                    .withDynamicPayload(errorCode)
                    .buildConstraintViolationWithTemplate(message)
                    .addPropertyNode(path)
                    .addConstraintViolation();
        }

        private boolean isEmpty() {
            return reported.isEmpty();
        }
    }
}
