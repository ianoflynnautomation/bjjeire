package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class WriteAuthorizationIT extends MongoIntegrationTest {

    @Test
    void shouldRejectAnonymousCreateWithUnauthorized() {
        ResponseEntity<String> response =
                restTemplate.postForEntity(ApiRoutes.GYM, jsonEntity(gymCommandJson(), null), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).contains("urn:bjjeire:unauthorized");
    }

    @Test
    void shouldRejectMalformedBearerWithUnauthorized() {
        ResponseEntity<String> response =
                restTemplate.postForEntity(ApiRoutes.GYM, jsonEntity(gymCommandJson(), "not a token"), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).contains("urn:bjjeire:unauthorized");
    }

    @Test
    void shouldRejectCreateWhenTokenLacksWriterScope() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                ApiRoutes.GYM, jsonEntity(gymCommandJson(), "reader-token-without-writer-scope"), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).contains("urn:bjjeire:forbidden");
    }

    @Test
    void shouldAllowCreateWhenTokenHasWriterScope() {
        ResponseEntity<String> response =
                restTemplate.postForEntity(ApiRoutes.GYM, jsonEntity(gymCommandJson()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    /** #5037: a signed-in competitor has no power over the directory. */
    @ParameterizedTest
    @Tag("#5037")
    @ValueSource(strings = {ApiRoutes.GYM, ApiRoutes.BJJ_EVENT, ApiRoutes.COMPETITION, ApiRoutes.STORE})
    void shouldForbidEveryDirectoryWriteForCompetitorTokens(String route) {
        String id = "/0123456789abcdef01234567";
        for (String token : List.of(COMPETITOR_TOKEN, COMPETITOR_TOKEN_WITHOUT_SCOPE)) {
            HttpEntity<String> request = jsonEntity("{}", token);

            assertForbidden(restTemplate.exchange(route, HttpMethod.POST, request, String.class));
            assertForbidden(restTemplate.exchange(route + id, HttpMethod.PUT, request, String.class));
            assertForbidden(restTemplate.exchange(route + id, HttpMethod.DELETE, request, String.class));
        }
    }

    /** #5036: the directory is still readable without an account while the tournament feature is on. */
    @ParameterizedTest
    @Tag("#5036")
    @ValueSource(strings = {ApiRoutes.GYM, ApiRoutes.BJJ_EVENT, ApiRoutes.COMPETITION, ApiRoutes.STORE})
    void shouldServeDirectoryListsToAnonymousVisitors(String route) {
        ResponseEntity<String> response = restTemplate.getForEntity(route, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private static void assertForbidden(ResponseEntity<String> response) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).contains("urn:bjjeire:forbidden");
    }

    private static String gymCommandJson() {
        return """
            {
              "data": {
                "name": "BJJ Dublin",
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
            """;
    }
}
