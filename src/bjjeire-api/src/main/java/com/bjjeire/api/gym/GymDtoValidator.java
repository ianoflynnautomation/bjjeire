package com.bjjeire.api.gym;

import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.GeoJsonPoints;
import com.bjjeire.api.common.HttpUrls;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import org.hibernate.validator.constraintvalidation.HibernateConstraintValidatorContext;

public class GymDtoValidator implements ConstraintValidator<ValidGym, GymDto> {
    static final String CODE_REQUIRED = "FIELD_REQUIRED";
    static final String CODE_MAX_LENGTH = "MAX_LENGTH_EXCEEDED";
    static final String CODE_INVALID_URL = "INVALID_URL";
    static final String CODE_NOT_NULL = "NOT_NULL";
    static final String CODE_INCLUSIVE_BETWEEN = "INCLUSIVE_BETWEEN_VALUE";
    static final String CODE_PREDICATE = "PredicateValidator";

    // Seeded addresses reach 105 characters, wider than the event address cap.
    private static final int MAX_ADDRESS = 200;
    private static final int MAX_VENUE = 100;
    private static final int MAX_NOTES = 200;
    private static final int MAX_AFFILIATION_NAME = 100;
    private static final int MAX_PLACE_NAME = 200;
    private static final int MAX_PLACE_ID = 255;
    private static final int MAX_COORDINATE_TYPE = 50;
    private static final int MAX_URL = 2048;

    private static final Pattern OBJECT_ID = Pattern.compile("^[0-9a-fA-F]{24}$");

    @Override
    public boolean isValid(GymDto dto, ConstraintValidatorContext context) {
        if (dto == null) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        Violations violations = new Violations(context);

        validateId(dto.id(), violations);
        validateAffiliation(dto.affiliation(), violations);
        validateTrialOffer(dto.trialOffer(), violations);
        validateLocation(dto.location(), violations);
        validateSocialMedia(dto.socialMedia(), violations);
        validateUrl(dto.website(), "website", "Website", violations);
        validateUrl(dto.timetableUrl(), "timetableUrl", "Timetable URL", violations);
        validateUrl(dto.imageUrl(), "imageUrl", "Image URL", violations);
        validateUrl(dto.thumbnailUrl(), "thumbnailUrl", "Thumbnail URL", violations);

        return violations.isEmpty();
    }

    private static void validateId(String id, Violations violations) {
        if (id != null && !id.isBlank() && !OBJECT_ID.matcher(id).matches()) {
            violations.add("id", "The provided ID is not in a valid format.", CODE_PREDICATE);
        }
    }

    private static void validateAffiliation(Affiliation affiliation, Violations violations) {
        if (affiliation == null) {
            return;
        }
        maxLength(affiliation.name(), MAX_AFFILIATION_NAME, "affiliation.name", "Affiliation Name", violations);
        validateUrl(affiliation.website(), "affiliation.website", "Affiliation Website", violations);
    }

    private static void validateTrialOffer(TrialOffer trialOffer, Violations violations) {
        if (trialOffer == null) {
            return;
        }
        maxLength(trialOffer.notes(), MAX_NOTES, "trialOffer.notes", "Trial Notes", violations);
    }

    private static void validateLocation(Location location, Violations violations) {
        if (location == null) {
            return;
        }
        requireString(location.address(), MAX_ADDRESS, "location.address", "Address", violations);
        requireString(location.venue(), MAX_VENUE, "location.venue", "Venue", violations);
        if (location.coordinates() == null) {
            violations.add("location.coordinates", "Coordinates cannot be null.", CODE_NOT_NULL);
            return;
        }
        validateCoordinates(location.coordinates(), violations);
    }

    private static void validateCoordinates(GeoCoordinates coordinates, Violations violations) {
        requireString(coordinates.type(), MAX_COORDINATE_TYPE, "location.coordinates.type", "Type", violations);
        List<Double> values = coordinates.coordinates();
        if (!GeoJsonPoints.isPair(values)) {
            violations.add(
                    "location.coordinates.coordinates",
                    "Coordinates must be a [longitude, latitude] pair.",
                    CODE_PREDICATE);
            return;
        }
        if (!GeoJsonPoints.longitudeInRange(values.get(0))) {
            violations.add(
                    "location.coordinates.longitude",
                    "Longitude must be between -180 and 180 inclusive.",
                    CODE_INCLUSIVE_BETWEEN);
        }
        if (!GeoJsonPoints.latitudeInRange(values.get(1))) {
            violations.add(
                    "location.coordinates.latitude",
                    "Latitude must be between -90 and 90 inclusive.",
                    CODE_INCLUSIVE_BETWEEN);
        }
        maxLength(coordinates.placeName(), MAX_PLACE_NAME, "location.coordinates.placeName", "Place Name", violations);
        maxLength(coordinates.placeId(), MAX_PLACE_ID, "location.coordinates.placeId", "Place ID", violations);
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

    private static void validateUrl(String url, String path, String name, Violations violations) {
        if (url == null || url.isBlank()) {
            return;
        }
        if (url.length() > MAX_URL || !HttpUrls.isHttpOrHttps(url)) {
            violations.add(path, name + " must be a valid URL.", CODE_INVALID_URL);
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
