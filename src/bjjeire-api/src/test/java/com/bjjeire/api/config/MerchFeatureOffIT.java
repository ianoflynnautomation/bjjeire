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
 * #6026, #6027 in the assembled application: the merch shop switched off and read-only mode on, as production runs
 * until merch is released.
 *
 * <p>The properties match {@link BjjEireCompetitionFeatureOffIT} exactly, so both classes share one cached context.
 */
@TestPropertySource(
        properties = {
            "bjjeire.feature-flags.BjjEireCompetitions=false",
            "bjjeire.feature-flags.Merch=false",
            "bjjeire.read-only-mode.enabled=true"
        })
class MerchFeatureOffIT extends MongoIntegrationTest {
    private static final String ID = "/0123456789abcdef01234567";

    @ParameterizedTest
    @Tag("#6026")
    @ValueSource(
            strings = {
                ApiRoutes.PRODUCT,
                ApiRoutes.PRODUCT + "/harp-rashguard",
                ApiRoutes.PRODUCT + "/admin",
                ApiRoutes.ORDER + ID,
                ApiRoutes.ORDER + "/delivery",
                ApiRoutes.ORDER + "/admin",
                ApiRoutes.ORDER + "/admin/dashboard",
                "/api/v1/%70roduct",
                "/api/v1/%6frder/admin"
            })
    void shouldAnswerNotFoundBeforeAuthenticationOnEveryMerchRead(String path) {
        for (String token : new String[] {null, COMPETITOR_TOKEN, "integration-test-token"}) {
            assertFeatureAbsent(exchange(HttpMethod.GET, path, token));
        }
    }

    @ParameterizedTest
    @Tag("#6026")
    @ValueSource(
            strings = {
                ApiRoutes.ORDER,
                ApiRoutes.ORDER + ID + "/checkout",
                ApiRoutes.ORDER_STRIPE_WEBHOOK,
                ApiRoutes.PRODUCT + "/admin",
                ApiRoutes.PRODUCT + "/admin" + ID + "/publish"
            })
    void shouldAnswerNotFoundBeforeAuthenticationOnEveryMerchWrite(String path) {
        for (String token : new String[] {null, COMPETITOR_TOKEN, "integration-test-token"}) {
            assertFeatureAbsent(exchange(HttpMethod.POST, path, token));
        }
    }

    /** #6027: with merch off, the directory reads as it always did, with no account. */
    @ParameterizedTest
    @Tag("#6027")
    @ValueSource(strings = {ApiRoutes.GYM, ApiRoutes.BJJ_EVENT, ApiRoutes.COMPETITION, ApiRoutes.STORE})
    void shouldServeDirectoryListsToAnonymousVisitors(String route) {
        assertThat(restTemplate.getForEntity(route, String.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    /** Read-only mode still protects the store directory, even from the organiser. */
    @Test
    @Tag("#6027")
    void shouldKeepAnsweringMethodNotAllowedForStoreDirectoryWrites() {
        ResponseEntity<String> response = exchange(HttpMethod.POST, ApiRoutes.STORE, "integration-test-token");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
    }

    /** The feature flag endpoint tells the SPA merch is off. */
    @Test
    @Tag("#6026")
    void shouldReportMerchOffToTheSpa() {
        assertThat(restTemplate
                        .getForEntity(ApiRoutes.FEATURE_FLAG, String.class)
                        .getBody())
                .contains("\"Merch\":false");
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
                .contains("The BJJ Éire merch shop is not available.")
                .containsPattern("^\\{.*\"traceId\":\"[^\"]+\"")
                .doesNotContain("\"properties\"");
    }
}
