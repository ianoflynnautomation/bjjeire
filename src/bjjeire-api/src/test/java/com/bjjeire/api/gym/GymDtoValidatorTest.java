package com.bjjeire.api.gym;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class GymDtoValidatorTest {
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
    void validGymProducesNoViolations() {
        assertThat(validator.validate(validDto())).isEmpty();
    }

    @Test
    void seededAddressAndPlaceIdLengthsAreAccepted() {
        GymDto dto = withLocation(new Location(
                "x".repeat(105),
                "Venue",
                new GeoCoordinates("Point", List.of(-6.26, 53.35), "Dublin", "ChIJfcPSiiNdW0gR3mnPDHnRPs0")));

        assertThat(validator.validate(dto)).isEmpty();
    }

    @Test
    void invalidObjectIdIsRejected() {
        Set<ConstraintViolation<GymDto>> violations = validator.validate(withId("not-an-object-id"));

        assertThat(violations)
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("id")
                        && violation.getMessage().equals("The provided ID is not in a valid format."));
    }

    @Test
    void nullOrBlankIdIsAllowedForServerGeneratedCreates() {
        assertThat(validator.validate(withId(null)))
                .noneMatch(violation -> violation.getPropertyPath().toString().equals("id"));
        assertThat(validator.validate(withId("   ")))
                .noneMatch(violation -> violation.getPropertyPath().toString().equals("id"));
    }

    @Test
    void javascriptWebsiteIsRejected() {
        assertThat(validator.validate(withWebsite("javascript:alert(1)")))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("website"));
    }

    @Test
    void javascriptSocialAndAffiliationUrlsAreRejected() {
        GymDto social = withSocial(new SocialMedia(null, "javascript:alert(1)", null, null));
        GymDto affiliation = withAffiliation(new Affiliation("Gracie Barra", "javascript:alert(1)"));

        assertThat(validator.validate(social))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("socialMedia.facebook"));
        assertThat(validator.validate(affiliation))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("affiliation.website"));
    }

    @Test
    void missingOrOutOfRangeCoordinatesAreRejected() {
        assertThat(validator.validate(withLocation(new Location("1 Main Street", "Dublin Gym", null))))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("location.coordinates"));
        assertThat(validator.validate(withLocation(point(List.of(-6.26)))))
                .anyMatch(
                        violation -> violation.getPropertyPath().toString().equals("location.coordinates.coordinates"));
        assertThat(validator.validate(withLocation(point(List.of(181.0, 53.35)))))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("location.coordinates.longitude"));
        assertThat(validator.validate(withLocation(point(List.of(-6.26, 91.0)))))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("location.coordinates.latitude"));
    }

    @Test
    void httpUrlIsAccepted() {
        assertThat(validator.validate(withWebsite("http://example.com"))).isEmpty();
    }

    private static GymDto validDto() {
        return new GymDto(
                null,
                "BJJ Dublin",
                "",
                GymStatus.Active,
                County.Dublin,
                null,
                new TrialOffer(false, null, null, null),
                new Location(
                        "1 Main Street",
                        "Dublin Gym",
                        new GeoCoordinates("Point", List.of(-6.2603, 53.3498), "Dublin", "test")),
                new SocialMedia(null, null, null, null),
                List.of(),
                "https://example.com",
                null,
                "https://cdn.bjjeire.com/gyms/test-lg.webp",
                null,
                null);
    }

    private static GymDto withId(String id) {
        GymDto dto = validDto();
        return new GymDto(
                id,
                dto.name(),
                dto.description(),
                dto.status(),
                dto.county(),
                dto.affiliation(),
                dto.trialOffer(),
                dto.location(),
                dto.socialMedia(),
                dto.offeredClasses(),
                dto.website(),
                dto.timetableUrl(),
                dto.imageUrl(),
                dto.thumbnailUrl(),
                dto.version());
    }

    private static GymDto withWebsite(String website) {
        GymDto dto = validDto();
        return new GymDto(
                dto.id(),
                dto.name(),
                dto.description(),
                dto.status(),
                dto.county(),
                dto.affiliation(),
                dto.trialOffer(),
                dto.location(),
                dto.socialMedia(),
                dto.offeredClasses(),
                website,
                dto.timetableUrl(),
                dto.imageUrl(),
                dto.thumbnailUrl(),
                dto.version());
    }

    private static GymDto withSocial(SocialMedia socialMedia) {
        GymDto dto = validDto();
        return new GymDto(
                dto.id(),
                dto.name(),
                dto.description(),
                dto.status(),
                dto.county(),
                dto.affiliation(),
                dto.trialOffer(),
                dto.location(),
                socialMedia,
                dto.offeredClasses(),
                dto.website(),
                dto.timetableUrl(),
                dto.imageUrl(),
                dto.thumbnailUrl(),
                dto.version());
    }

    private static GymDto withAffiliation(Affiliation affiliation) {
        GymDto dto = validDto();
        return new GymDto(
                dto.id(),
                dto.name(),
                dto.description(),
                dto.status(),
                dto.county(),
                affiliation,
                dto.trialOffer(),
                dto.location(),
                dto.socialMedia(),
                dto.offeredClasses(),
                dto.website(),
                dto.timetableUrl(),
                dto.imageUrl(),
                dto.thumbnailUrl(),
                dto.version());
    }

    private static GymDto withLocation(Location location) {
        GymDto dto = validDto();
        return new GymDto(
                dto.id(),
                dto.name(),
                dto.description(),
                dto.status(),
                dto.county(),
                dto.affiliation(),
                dto.trialOffer(),
                location,
                dto.socialMedia(),
                dto.offeredClasses(),
                dto.website(),
                dto.timetableUrl(),
                dto.imageUrl(),
                dto.thumbnailUrl(),
                dto.version());
    }

    private static Location point(List<Double> coordinates) {
        return new Location("1 Main Street", "Dublin Gym", new GeoCoordinates("Point", coordinates, "Dublin", "test"));
    }
}
