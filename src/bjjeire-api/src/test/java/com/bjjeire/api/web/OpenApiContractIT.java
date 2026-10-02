package com.bjjeire.api.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.County;
import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.competition.CompetitionRepository;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.event.BjjEventRepository;
import com.bjjeire.api.event.BjjEventSchedule;
import com.bjjeire.api.event.BjjEventSession;
import com.bjjeire.api.event.BjjEventType;
import com.bjjeire.api.event.EventStatus;
import com.bjjeire.api.event.Organizer;
import com.bjjeire.api.event.PricingModel;
import com.bjjeire.api.event.PricingType;
import com.bjjeire.api.event.ScheduleKind;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.gym.GymRepository;
import com.bjjeire.api.gym.GymStatus;
import com.bjjeire.api.gym.TrialOffer;
import com.bjjeire.api.store.Store;
import com.bjjeire.api.store.StoreRepository;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import com.bjjeire.api.testsupport.OpenApiResponseValidator;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

class OpenApiContractIT extends MongoIntegrationTest {
    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private BjjEventRepository bjjEventRepository;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Test
    void shouldExposeMigratedEndpointsAndRequireBearerAuthForWriteOperations() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity("/v3/api-docs", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode document = objectMapper.readTree(response.getBody());

        assertThat(document.at("/components/securitySchemes/BearerAuth/type").asText())
                .isEqualTo("http");
        assertThat(document.at("/components/securitySchemes/BearerAuth/scheme").asText())
                .isEqualTo("bearer");
        assertThat(document.at("/paths").propertyNames())
                .contains(
                        ApiRoutes.GYM,
                        ApiRoutes.BJJ_EVENT,
                        ApiRoutes.COMPETITION,
                        ApiRoutes.STORE,
                        ApiRoutes.DONATE + "/bitcoin/qr");

        JsonNode gymGet = document.at(operationPointer(ApiRoutes.GYM, "get"));
        JsonNode gymPost = document.at(operationPointer(ApiRoutes.GYM, "post"));
        JsonNode eventPut = document.at(operationPointer(ApiRoutes.BJJ_EVENT + "/{id}", "put"));
        JsonNode eventDelete = document.at(operationPointer(ApiRoutes.BJJ_EVENT + "/{id}", "delete"));

        assertThat(gymGet.has("security")).isFalse();
        assertThat(hasBearerSecurity(gymPost)).isTrue();
        assertThat(hasBearerSecurity(eventPut)).isTrue();
        assertThat(hasBearerSecurity(eventDelete)).isTrue();
    }

    @Test
    void shouldExportOpenApiArtifactWhenRequestedByCi() throws Exception {
        String artifactPath = System.getenv("OPENAPI_ARTIFACT_PATH");
        Assumptions.assumeTrue(artifactPath != null && !artifactPath.isBlank());

        ResponseEntity<String> response = restTemplate.getForEntity("/v3/api-docs", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode document = objectMapper.readTree(response.getBody());
        assertThat(document.hasNonNull("openapi")).isTrue();
        assertThat(document.hasNonNull("paths")).isTrue();

        Path output = Path.of(artifactPath);
        if (output.getParent() != null) {
            Files.createDirectories(output.getParent());
        }
        Files.writeString(output, response.getBody());
    }

    @Test
    void shouldReturnPublicListingsThatMatchTheServedSchema() throws Exception {
        gymRepository.save(gym());
        bjjEventRepository.save(event());
        competitionRepository.save(competition());
        storeRepository.save(store());

        JsonNode document = objectMapper.readTree(openApiDocument().getBody());
        OpenApiResponseValidator validator = new OpenApiResponseValidator(document);

        assertListingMatches(validator, ApiRoutes.GYM);
        assertListingMatches(validator, ApiRoutes.BJJ_EVENT);
        assertListingMatches(validator, ApiRoutes.COMPETITION);
        assertListingMatches(validator, ApiRoutes.STORE);
    }

    private ResponseEntity<String> openApiDocument() {
        ResponseEntity<String> response = restTemplate.getForEntity("/v3/api-docs", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response;
    }

    private void assertListingMatches(OpenApiResponseValidator validator, String route) throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(route + "?page=1&pageSize=20", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/data").size()).isGreaterThan(0);
        assertThat(body.at("/pagination/previousPageUrl").isNull()).isTrue();
        assertThat(validator.validateGet(route, body)).isEmpty();
    }

    private static Gym gym() {
        return Gym.builder()
                .name("Contract Gym")
                .status(GymStatus.Active)
                .county(County.Dublin)
                .trialOffer(new TrialOffer(false, null, null, null))
                .location(location())
                .socialMedia(new SocialMedia(null, null, null, null))
                .build();
    }

    private static BjjEvent event() {
        Instant start = Instant.parse("2026-08-01T10:00:00Z");
        return BjjEvent.builder()
                .name("Contract Open Mat")
                .description("Open training session")
                .types(List.of(BjjEventType.OpenMat))
                .organiser(new Organizer("BJJ Eire", "https://bjjeire.com"))
                .status(EventStatus.Upcoming)
                .county(County.Dublin)
                .location(location())
                .socialMedia(new SocialMedia(null, null, null, null))
                .schedule(new BjjEventSchedule(
                        ScheduleKind.FixedDates,
                        start,
                        Instant.parse("2026-08-01T12:00:00Z"),
                        List.of(new BjjEventSession(
                                start, null, LocalTime.of(10, 0), LocalTime.of(12, 0), "Session 1", null))))
                .pricingOptions(List.of(new PricingModel(PricingType.Free, null, null, BigDecimal.ZERO, null, null)))
                .eventUrl("https://example.com/events/contract-open-mat")
                .imageUrl("https://cdn.bjjeire.com/events/contract-lg.webp")
                .active(true)
                .build();
    }

    private static Competition competition() {
        return Competition.builder()
                .slug("contract-open")
                .name("Contract Open")
                .organisation("IBJJF")
                .country("Ireland")
                .websiteUrl("https://example.com/contract-open")
                .tags(List.of("gi"))
                .startDate(Instant.parse("2026-08-01T09:00:00Z"))
                .endDate(Instant.parse("2026-08-02T18:00:00Z"))
                .isActive(true)
                .build();
    }

    private static Store store() {
        return Store.builder()
                .name("Contract Store")
                .websiteUrl("https://example.com/store")
                .isActive(true)
                .build();
    }

    private static Location location() {
        return new Location(
                "1 Main Street",
                "Dublin Gym",
                new GeoCoordinates("Point", List.of(-6.2603, 53.3498), "Dublin", "test"));
    }

    // Builds a JSON Pointer into the OpenAPI paths object, escaping '/' as '~1' per RFC 6901.
    private static String operationPointer(String route, String httpMethod) {
        return "/paths/" + route.replace("/", "~1") + "/" + httpMethod;
    }

    private static boolean hasBearerSecurity(JsonNode operation) {
        JsonNode security = operation.path("security");
        if (!security.isArray()) {
            return false;
        }

        return StreamSupport.stream(security.spliterator(), false)
                .map(requirement -> requirement.path("BearerAuth"))
                .anyMatch(scopes -> scopes.isArray()
                        && StreamSupport.stream(scopes.spliterator(), false)
                                .map(JsonNode::asText)
                                .toList()
                                .equals(List.of()));
    }
}
