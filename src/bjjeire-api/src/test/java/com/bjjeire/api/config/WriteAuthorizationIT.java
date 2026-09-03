package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class WriteAuthorizationIT extends MongoIntegrationTest {

    @Test
    void shouldRejectAnonymousCreateWithUnauthorized() {
        ResponseEntity<String> response =
                restTemplate.postForEntity(ApiRoutes.GYM, jsonEntity(gymCommandJson(), null), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void shouldRejectCreateWhenTokenLacksWriterScope() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                ApiRoutes.GYM, jsonEntity(gymCommandJson(), "reader-token-without-writer-scope"), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void shouldAllowCreateWhenTokenHasWriterScope() {
        ResponseEntity<String> response =
                restTemplate.postForEntity(ApiRoutes.GYM, jsonEntity(gymCommandJson()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
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
