package com.bjjeire.api.event;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditLogEntry;
import com.bjjeire.api.common.County;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

class BjjEventMongoRepositoryIT extends MongoIntegrationTest {
    @Autowired
    private BjjEventRepository bjjEventRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldExcludeInactiveExpiredAndCompletedEventsWhenListingByCountyAndType() throws Exception {
        bjjEventRepository.save(event(
                "202605310000000000000001",
                "valid-open-mat",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-01T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000002",
                "inactive-open-mat",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                false,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-02T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000003",
                "expired-open-mat",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-01-01T10:00:00Z",
                "2026-01-01T12:00:00Z",
                "2026-01-03T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000004",
                "completed-open-mat",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Completed,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-04T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000005",
                "cork-open-mat",
                County.Cork,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-05T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000006",
                "dublin-seminar",
                County.Dublin,
                List.of(BjjEventType.Seminar),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-06T00:00:00Z"));

        ResponseEntity<String> response = restTemplate.getForEntity(
                "/api/v1/BjjEvent?county=Dublin&types=OpenMat&page=1&pageSize=20", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/data/0/id").asText()).isEqualTo("202605310000000000000001");
        assertThat(body.at("/data/0/name").asText()).isEqualTo("valid-open-mat");
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(1);
    }

    @Test
    void shouldMatchEventsWhereAnyTypeOverlapsRequestedTypes() throws Exception {
        bjjEventRepository.save(event(
                "202605310000000000000051",
                "camp-with-open-mat",
                County.Clare,
                List.of(BjjEventType.Camp, BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-01T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000052",
                "seminar-only",
                County.Clare,
                List.of(BjjEventType.Seminar),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-02T00:00:00Z"));

        ResponseEntity<String> response =
                restTemplate.getForEntity("/api/v1/BjjEvent?types=OpenMat&types=Camp&page=1&pageSize=20", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(1);
        assertThat(body.at("/data/0/id").asText()).isEqualTo("202605310000000000000051");
    }

    @Test
    void shouldFilterByNumericEventTypeCodeMatchingTheClientEnum() throws Exception {
        bjjEventRepository.save(event(
                "202605310000000000000081",
                "open-mat",
                County.Clare,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-01T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000082",
                "seminar",
                County.Clare,
                List.of(BjjEventType.Seminar),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-02T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000083",
                "camp",
                County.Clare,
                List.of(BjjEventType.Camp),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-03T00:00:00Z"));

        JsonNode seminar = objectMapper.readTree(restTemplate
                .getForEntity("/api/v1/BjjEvent?types=1&page=1&pageSize=20", String.class)
                .getBody());
        assertThat(seminar.at("/pagination/totalItems").asInt()).isEqualTo(1);
        assertThat(seminar.at("/data/0/name").asText()).isEqualTo("seminar");
        assertThat(seminar.at("/data/0/types/0").asText()).isEqualTo("Seminar");

        JsonNode camp = objectMapper.readTree(restTemplate
                .getForEntity("/api/v1/BjjEvent?types=3&page=1&pageSize=20", String.class)
                .getBody());
        assertThat(camp.at("/pagination/totalItems").asInt()).isEqualTo(1);
        assertThat(camp.at("/data/0/name").asText()).isEqualTo("camp");
    }

    @Test
    void shouldBuildAbsoluteNavigationLinksWithOnlyPageAndPageSize() throws Exception {
        bjjEventRepository.save(event(
                "202605310000000000000061",
                "first",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-01T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000062",
                "second",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-02T00:00:00Z"));

        ResponseEntity<String> response =
                restTemplate.getForEntity("/api/v1/BjjEvent?county=Dublin&page=1&pageSize=1", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/pagination/nextPageUrl").asText())
                .startsWith("http://")
                .endsWith("/api/v1/BjjEvent?page=2&pageSize=1");
        assertThat(body.at("/pagination/previousPageUrl").isNull()).isTrue();
    }

    @Test
    void shouldInvalidateListCacheOnApiWritesButNotOnRepositoryWrites() throws Exception {
        bjjEventRepository.save(event(
                "202605310000000000000071",
                "cached-event",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-01T00:00:00Z"));

        JsonNode first = objectMapper.readTree(restTemplate
                .getForEntity("/api/v1/BjjEvent?page=1&pageSize=20", String.class)
                .getBody());
        assertThat(first.at("/pagination/totalItems").asInt()).isEqualTo(1);

        // A repository write bypasses the service cache — the list stays cached.
        bjjEventRepository.save(event(
                "202605310000000000000072",
                "uncached-event",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-02T00:00:00Z"));
        JsonNode second = objectMapper.readTree(restTemplate
                .getForEntity("/api/v1/BjjEvent?page=1&pageSize=20", String.class)
                .getBody());
        assertThat(second.at("/pagination/totalItems").asInt()).isEqualTo(1);

        // An API write invalidates the tag, so the next read sees everything.
        ResponseEntity<String> created = restTemplate.postForEntity(
                "/api/v1/BjjEvent",
                jsonEntity(eventCommandJson("202605310000000000000073", "api-created-event")),
                String.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        JsonNode third = objectMapper.readTree(restTemplate
                .getForEntity("/api/v1/BjjEvent?page=1&pageSize=20", String.class)
                .getBody());
        assertThat(third.at("/pagination/totalItems").asInt()).isEqualTo(3);
    }

    @Test
    void shouldStillExcludeCompletedEventsWhenIncludingInactive() throws Exception {
        bjjEventRepository.save(event(
                "202605310000000000000011",
                "inactive-open-mat",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                false,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-01T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000012",
                "expired-open-mat",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-01-01T10:00:00Z",
                "2026-01-01T12:00:00Z",
                "2026-01-02T00:00:00Z"));
        bjjEventRepository.save(event(
                "202605310000000000000013",
                "completed-open-mat",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Completed,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-03T00:00:00Z"));

        ResponseEntity<String> response =
                restTemplate.getForEntity("/api/v1/BjjEvent?includeInactive=true&page=1&pageSize=20", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(2);
    }

    @Test
    void shouldRoundTripScheduleSessionsAndPricingThroughMongo() throws Exception {
        bjjEventRepository.save(event(
                "202605310000000000000021",
                "inactive-open-mat",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                false,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-01T00:00:00Z"));

        ResponseEntity<String> response =
                restTemplate.getForEntity("/api/v1/BjjEvent/202605310000000000000021", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/id").asText()).isEqualTo("202605310000000000000021");
        assertThat(body.at("/isActive").asBoolean()).isFalse();
        assertThat(body.at("/types/0").asText()).isEqualTo("OpenMat");
        assertThat(body.at("/schedule/kind").asText()).isEqualTo("FixedDates");
        assertThat(body.at("/schedule/sessions/0/startTime").asText()).isEqualTo("10:00:00");
        assertThat(body.at("/schedule/sessions/0/endTime").asText()).isEqualTo("12:00:00");
        assertThat(body.at("/pricingOptions/0/type").asText()).isEqualTo("Free");
        assertThat(body.at("/pricingOptions/1/type").asText()).isEqualTo("FlatRate");
        assertThat(body.at("/pricingOptions/1/amount").decimalValue()).isEqualByComparingTo(new BigDecimal("275"));
    }

    @Test
    void shouldPersistEventWithAuditFieldsAndExpiryWhenCreatingThroughAuthenticatedApi() throws Exception {
        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/v1/BjjEvent",
                jsonEntity(eventCommandJson("202605310000000000000061", "Created Open Mat")),
                String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(body.at("/data/id").asText()).isEqualTo("202605310000000000000061");
        assertThat(body.at("/data/name").asText()).isEqualTo("Created Open Mat");
        BjjEvent savedEvent =
                bjjEventRepository.findById("202605310000000000000061").orElseThrow();
        assertThat(savedEvent.getCreatedBy()).isEqualTo(AUTHENTICATED_USER);
        assertThat(savedEvent.getCreatedOnUtc()).isNotNull();
        assertThat(savedEvent.getExpiresAt())
                .isEqualTo(Instant.parse("2026-08-01T12:00:00Z").plus(BjjEvent.EXPIRY_GRACE));
    }

    @Test
    void shouldRejectCreateWithoutPersistingWhenIdIsMissing() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/v1/BjjEvent", jsonEntity(eventCommandJson(null, "Created Open Mat")), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(bjjEventRepository.count()).isZero();
    }

    @Test
    void shouldPersistChangesWithAuditFieldsAndExpiryWhenUpdatingThroughAuthenticatedApi() throws Exception {
        BjjEvent savedEvent = bjjEventRepository.save(event(
                "202605310000000000000031",
                "Original Event",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-01T00:00:00Z"));

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/v1/BjjEvent/" + savedEvent.getId(),
                HttpMethod.PUT,
                jsonEntity(eventCommandJson(savedEvent.getId(), "Updated Event")),
                String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/data/id").asText()).isEqualTo(savedEvent.getId());
        assertThat(body.at("/data/name").asText()).isEqualTo("Updated Event");
        BjjEvent updatedEvent = bjjEventRepository.findById(savedEvent.getId()).orElseThrow();
        assertThat(updatedEvent.getName()).isEqualTo("Updated Event");
        assertThat(updatedEvent.getUpdatedBy()).isEqualTo(AUTHENTICATED_USER);
        assertThat(updatedEvent.getUpdatedOnUtc()).isNotNull();
        assertThat(updatedEvent.getExpiresAt())
                .isEqualTo(Instant.parse("2026-08-01T12:00:00Z").plus(BjjEvent.EXPIRY_GRACE));
    }

    @Test
    void shouldRemoveEventAndWriteAuditLogWhenDeletingThroughAuthenticatedApi() {
        BjjEvent savedEvent = bjjEventRepository.save(event(
                "202605310000000000000041",
                "Deleted Event",
                County.Dublin,
                List.of(BjjEventType.OpenMat),
                EventStatus.Upcoming,
                true,
                "2026-08-01T10:00:00Z",
                "2026-08-01T12:00:00Z",
                "2026-01-01T00:00:00Z"));

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/v1/BjjEvent/" + savedEvent.getId(), HttpMethod.DELETE, jsonEntity(null), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(bjjEventRepository.findById(savedEvent.getId())).isEmpty();
        assertThat(mongoTemplate.findAll(AuditLogEntry.class))
                .anyMatch(entry -> entry.getAction() == AuditAction.Delete
                        && entry.getEntityType().equals("BjjEvent")
                        && savedEvent.getId().equals(entry.getEntityId())
                        && entry.getActor().equals(AUTHENTICATED_USER));
    }

    private static BjjEvent event(
            String id,
            String name,
            County county,
            List<BjjEventType> types,
            EventStatus status,
            boolean isActive,
            String startDate,
            String endDate,
            String createdAt) {
        BjjEvent event = new BjjEvent();
        event.setId(id);
        event.setName(name);
        event.setDescription("Open training session");
        event.setCounty(county);
        event.setTypes(types);
        event.setStatus(status);
        event.setOrganiser(new Organizer("BJJ Eire", "https://bjjeire.com"));
        event.setSchedule(new BjjEventSchedule(
                ScheduleKind.FixedDates,
                Instant.parse(startDate),
                Instant.parse(endDate),
                List.of(new BjjEventSession(
                        Instant.parse(startDate), null, LocalTime.of(10, 0), LocalTime.of(12, 0), "Session 1", null))));
        event.setPricingOptions(List.of(
                new PricingModel(PricingType.Free, null, null, BigDecimal.ZERO, null, null),
                new PricingModel(PricingType.FlatRate, "Full pass", null, new BigDecimal("275"), 1, "EUR")));
        event.setEventUrl("https://example.com/events/" + name);
        event.setActive(isActive);
        event.setCreatedOnUtc(Instant.parse(createdAt));
        return event;
    }

    private static String eventCommandJson(String id, String name) {
        String idJson = id == null ? "null" : "\"" + id + "\"";
        return """
            {
              "data": {
                "id": %s,
                "name": "%s",
                "description": "Open training session",
                "types": ["OpenMat"],
                "organiser": { "name": "BJJ Eire", "website": "https://bjjeire.com" },
                "status": "Upcoming",
                "statusReason": null,
                "socialMedia": { "instagram": null, "facebook": null, "x": null, "youTube": null },
                "county": "Dublin",
                "location": {
                  "address": "1 Main Street",
                  "venue": "Dublin Gym",
                  "coordinates": { "type": "Point", "coordinates": [-6.2603, 53.3498], "placeName": "Dublin", "placeId": "test" }
                },
                "schedule": {
                  "kind": "FixedDates",
                  "startDate": "2026-08-01T10:00:00Z",
                  "endDate": "2026-08-01T12:00:00Z",
                  "sessions": [
                    { "date": "2026-08-01T10:00:00Z", "day": null, "startTime": "10:00:00", "endTime": "12:00:00", "title": "Session 1", "types": null }
                  ]
                },
                "pricingOptions": [
                  { "type": "Free", "label": null, "appliesToTypes": null, "amount": 0, "durationDays": null, "currency": null }
                ],
                "eventUrl": "https://example.com/events/open-mat",
                "imageUrl": null,
                "isActive": true
              }
            }
            """.formatted(idJson, name);
    }
}
