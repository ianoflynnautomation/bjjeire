package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

/**
 * #5038 in the assembled application: the tournament feature switched off, read-only mode on, as production runs until
 * the feature is released.
 *
 * <p>This class costs a second application context. The shared context keeps the flag on for every other IT.
 */
@TestPropertySource(properties = {"bjjeire.feature-flags.Tournaments=false", "bjjeire.read-only-mode.enabled=true"})
class TournamentFeatureOffIT extends MongoIntegrationTest {
    private static final String ID = "/0123456789abcdef01234567";

    @ParameterizedTest
    @Tag("#5038")
    @ValueSource(
            strings = {
                ApiRoutes.TOURNAMENT,
                ApiRoutes.TOURNAMENT + "/bjjeire",
                ApiRoutes.TOURNAMENT + "/admin",
                ApiRoutes.TOURNAMENT + ID + "/leaderboard",
                ApiRoutes.TOURNAMENT + ID + "/eligible-division",
                ApiRoutes.COMPETITOR + "/me",
                ApiRoutes.REGISTRATION + "/me",
                "/api/v1/%74ournament",
                "/api/v1/%63ompetitor/me"
            })
    void shouldAnswerNotFoundBeforeAuthenticationOnEveryTournamentRead(String path) {
        for (String token : new String[] {null, COMPETITOR_TOKEN, "integration-test-token"}) {
            assertFeatureAbsent(exchange(HttpMethod.GET, path, token));
        }
    }

    @ParameterizedTest
    @Tag("#5038")
    @ValueSource(
            strings = {
                ApiRoutes.TOURNAMENT,
                ApiRoutes.TOURNAMENT + ID + "/publish",
                ApiRoutes.REGISTRATION,
                ApiRoutes.STRIPE_WEBHOOK
            })
    void shouldAnswerNotFoundBeforeAuthenticationOnEveryTournamentWrite(String path) {
        for (String token : new String[] {null, COMPETITOR_TOKEN, "integration-test-token"}) {
            assertFeatureAbsent(exchange(HttpMethod.POST, path, token));
        }
    }

    /** #5036: with the feature off, the directory reads as it always did. */
    @ParameterizedTest
    @Tag("#5036")
    @ValueSource(strings = {ApiRoutes.GYM, ApiRoutes.BJJ_EVENT, ApiRoutes.COMPETITION, ApiRoutes.STORE})
    void shouldServeDirectoryListsToAnonymousVisitors(String route) {
        assertThat(restTemplate.getForEntity(route, String.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    /** Read-only mode still protects the directory, even from the admin. */
    @Test
    void shouldKeepAnsweringMethodNotAllowedForAdminDirectoryWrites() {
        ResponseEntity<String> response = exchange(HttpMethod.POST, ApiRoutes.GYM, "integration-test-token");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
        assertThat(response.getBody()).contains("urn:bjjeire:method-not-allowed");
    }

    /** The feature flag endpoint tells the SPA the feature is off. */
    @Test
    @Tag("#5038")
    void shouldReportTournamentsOffToTheSpa() {
        assertThat(restTemplate
                        .getForEntity(ApiRoutes.FEATURE_FLAG, String.class)
                        .getBody())
                .contains("\"Tournaments\":false");
    }

    private ResponseEntity<String> exchange(HttpMethod method, String path, String bearerToken) {
        // A URI object keeps the percent-encoding exactly as written.
        return restTemplate.exchange(
                java.net.URI.create(restTemplate
                                .getUriTemplateHandler()
                                .expand("/")
                                .toString()
                                .replaceAll("/$", "")
                        + path),
                method,
                jsonEntity("{}", bearerToken),
                String.class);
    }

    private static void assertFeatureAbsent(ResponseEntity<String> response) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody())
                .contains("The tournament feature is not available.")
                // Top level, as every other problem document has it, not nested under "properties".
                .containsPattern("^\\{.*\"traceId\":\"[^\"]+\"")
                .doesNotContain("\"properties\"");
    }
}
