package com.bjjeire.api.gym;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.County;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

class GymMongoRepositoryIT extends MongoIntegrationTest {
    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldListOnlyActiveGymsWhenFilteringByCounty() throws Exception {
        gymRepository.save(gym("Active Gym", GymStatus.Active));
        gymRepository.save(gym("Pending Gym", GymStatus.PendingApproval));

        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.GYM + "?county=Dublin&page=1&pageSize=20", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/data/0/name").asText()).isEqualTo("Active Gym");
        assertThat(body.at("/data/0/status").asText()).isEqualTo("Active");
        assertThat(body.at("/data/0/county").asText()).isEqualTo("Dublin");
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(1);
    }

    @Test
    void shouldRejectUnknownCountyWhenListingGyms() {
        gymRepository.save(gym("Active Gym", GymStatus.Active));

        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.GYM + "?county=Atlantis&page=1&pageSize=20", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void shouldSerializeExplicitNullNavigationLinksWhenPageIsBeyondLast() throws Exception {
        gymRepository.save(gym("Active Gym", GymStatus.Active));

        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.GYM + "?page=2&pageSize=20", String.class);

        JsonNode pagination = objectMapper.readTree(response.getBody()).at("/pagination");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(pagination.has("nextPageUrl")).isTrue();
        assertThat(pagination.get("nextPageUrl").isNull()).isTrue();
    }

    @Test
    void shouldReturnNotFoundWhenGettingInactiveGymById() {
        Gym savedGym = gymRepository.save(gym("Pending Gym", GymStatus.PendingApproval));

        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.GYM + "/" + savedGym.getId(), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void shouldPersistGymWithAuditFieldsWhenCreatingThroughAuthenticatedApi() throws Exception {
        ResponseEntity<String> response = restTemplate.postForEntity(
                ApiRoutes.GYM, jsonEntity(gymCommandJson(null, "Created Gym")), String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(body.at("/data/id").asText()).isNotBlank();
        assertThat(body.at("/data/name").asText()).isEqualTo("Created Gym");
        Gym savedGym = gymRepository.findById(body.at("/data/id").asText()).orElseThrow();
        assertThat(savedGym.getCreatedBy()).isEqualTo(AUTHENTICATED_USER);
        assertThat(savedGym.getCreatedOnUtc()).isNotNull();
    }

    @Test
    void shouldPersistChangesWithAuditFieldsWhenUpdatingThroughAuthenticatedApi() throws Exception {
        Gym savedGym = gymRepository.save(gym("Original Gym", GymStatus.Active));

        ResponseEntity<String> response = restTemplate.exchange(
                ApiRoutes.GYM + "/" + savedGym.getId(),
                HttpMethod.PUT,
                jsonEntity(gymCommandJson(savedGym.getId(), "Updated Gym")),
                String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/data/id").asText()).isEqualTo(savedGym.getId());
        assertThat(body.at("/data/name").asText()).isEqualTo("Updated Gym");
        Gym updatedGym = gymRepository.findById(savedGym.getId()).orElseThrow();
        assertThat(updatedGym.getName()).isEqualTo("Updated Gym");
        assertThat(updatedGym.getUpdatedBy()).isEqualTo(AUTHENTICATED_USER);
        assertThat(updatedGym.getUpdatedOnUtc()).isNotNull();
    }

    @Test
    void shouldRemoveGymWhenDeletingThroughAuthenticatedApi() {
        Gym savedGym = gymRepository.save(gym("Deleted Gym", GymStatus.Active));

        ResponseEntity<String> response = restTemplate.exchange(
                ApiRoutes.GYM + "/" + savedGym.getId(), HttpMethod.DELETE, jsonEntity(null), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(gymRepository.findById(savedGym.getId())).isEmpty();
    }

    private static Gym gym(String name, GymStatus status) {
        Gym gym = new Gym();
        gym.setName(name);
        gym.setStatus(status);
        gym.setCounty(County.Dublin);
        return gym;
    }

    private static String gymCommandJson(String id, String name) {
        String idJson = id == null ? "null" : "\"" + id + "\"";
        return """
            {
              "data": {
                "id": %s,
                "name": "%s",
                "description": "",
                "status": "Active",
                "county": "Dublin",
                "trialOffer": { "isAvailable": false, "freeClasses": null, "freeDays": null, "notes": null },
                "location": {
                  "address": "1 Main Street",
                  "venue": "Dublin Gym",
                  "coordinates": { "type": "Point", "coordinates": [-6.2603, 53.3498], "placeName": "Dublin", "placeId": "test" }
                },
                "socialMedia": { "instagram": null, "facebook": null, "x": null, "youTube": null },
                "offeredClasses": [],
                "website": "https://example.com",
                "timetableUrl": null,
                "imageUrl": "https://cdn.bjjeire.com/gyms/test-lg.webp",
                "thumbnailUrl": "https://cdn.bjjeire.com/gyms/test-thumb.webp"
              }
            }
            """.formatted(idJson, name);
    }
}
