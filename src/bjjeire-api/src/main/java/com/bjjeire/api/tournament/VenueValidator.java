package com.bjjeire.api.tournament;

import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.GeoJsonPoints;
import com.bjjeire.api.common.Location;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.List;
import org.hibernate.validator.constraintvalidation.HibernateConstraintValidatorContext;

/**
 * The gym location rules, except that a tournament may be announced before its address or map point is known. A range
 * check cannot tell a swapped {@code [latitude, longitude]} pair from a real one; the SPA never sends coordinates.
 */
public class VenueValidator implements ConstraintValidator<ValidVenue, Location> {
    static final int MAX_VENUE = 100;
    static final int MAX_ADDRESS = 200;
    private static final int MAX_PLACE_NAME = 200;
    private static final int MAX_PLACE_ID = 255;
    private static final int MAX_COORDINATE_TYPE = 50;

    @Override
    public boolean isValid(Location venue, ConstraintValidatorContext context) {
        if (venue == null) {
            // @NotNull reports a missing venue.
            return true;
        }
        context.disableDefaultConstraintViolation();
        boolean valid = true;
        if (venue.venue() == null || venue.venue().isBlank()) {
            valid = add(context, "venue", "Venue name is required.", "FIELD_REQUIRED");
        } else if (venue.venue().length() > MAX_VENUE) {
            valid = add(context, "venue", tooLong("Venue name", MAX_VENUE), "MAX_LENGTH_EXCEEDED");
        }
        if (venue.address() != null && venue.address().length() > MAX_ADDRESS) {
            valid = add(context, "address", tooLong("Address", MAX_ADDRESS), "MAX_LENGTH_EXCEEDED");
        }
        if (venue.coordinates() != null) {
            valid &= coordinatesValid(venue.coordinates(), context);
        }
        return valid;
    }

    private static boolean coordinatesValid(GeoCoordinates coordinates, ConstraintValidatorContext context) {
        boolean valid = true;
        List<Double> values = coordinates.coordinates();
        if (!GeoJsonPoints.isPair(values)) {
            return add(
                    context,
                    "coordinates.coordinates",
                    "Coordinates must be a [longitude, latitude] pair.",
                    "PredicateValidator");
        }
        if (!GeoJsonPoints.longitudeInRange(values.get(0))) {
            valid = add(
                    context,
                    "coordinates.longitude",
                    "Longitude must be between -180 and 180 inclusive.",
                    "INCLUSIVE_BETWEEN_VALUE");
        }
        if (!GeoJsonPoints.latitudeInRange(values.get(1))) {
            valid = add(
                    context,
                    "coordinates.latitude",
                    "Latitude must be between -90 and 90 inclusive.",
                    "INCLUSIVE_BETWEEN_VALUE");
        }
        valid &= maxLength(context, coordinates.type(), MAX_COORDINATE_TYPE, "coordinates.type", "Type");
        valid &= maxLength(context, coordinates.placeName(), MAX_PLACE_NAME, "coordinates.placeName", "Place Name");
        valid &= maxLength(context, coordinates.placeId(), MAX_PLACE_ID, "coordinates.placeId", "Place ID");
        return valid;
    }

    private static boolean maxLength(
            ConstraintValidatorContext context, String value, int max, String path, String name) {
        return value == null || value.length() <= max || add(context, path, tooLong(name, max), "MAX_LENGTH_EXCEEDED");
    }

    private static String tooLong(String name, int max) {
        return name + " cannot exceed " + max + " characters.";
    }

    /** Reports one violation under the venue field and returns false, so callers can fold it into a result. */
    private static boolean add(ConstraintValidatorContext context, String path, String message, String errorCode) {
        context.unwrap(HibernateConstraintValidatorContext.class)
                .withDynamicPayload(errorCode)
                .buildConstraintViolationWithTemplate(message)
                .addPropertyNode(path)
                .addConstraintViolation();
        return false;
    }
}
