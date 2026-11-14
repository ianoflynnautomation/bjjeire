package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

/**
 * Who may call each kind of tournament route (ADR-0012, ADR-0013, contracts/contract.yaml).
 *
 * <p>These assert the security rules only. A caller who is let through reaches the controller, or a 404 while the route
 * has no controller yet, so "allowed" means neither 401 nor 403.
 */
class TournamentRouteAuthorizationIT extends MongoIntegrationTest {
    private static final String ID = "/0123456789abcdef01234567";

    @Test
    void shouldLetAnyoneReadPublicTournamentRoutes() {
        for (String path : new String[] {
            ApiRoutes.TOURNAMENT,
            ApiRoutes.TOURNAMENT + "/bjjeire",
            ApiRoutes.TOURNAMENT + ID + "/competitor",
            ApiRoutes.TOURNAMENT + ID + "/leaderboard"
        }) {
            assertAllowed(status(HttpMethod.GET, path, null));
        }
    }

    @Test
    void shouldReserveTournamentAdminReadsForTheAdmin() {
        for (String path :
                new String[] {ApiRoutes.TOURNAMENT + "/admin", ApiRoutes.TOURNAMENT + ID + "/registration"}) {
            assertThat(status(HttpMethod.GET, path, null)).isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(status(HttpMethod.GET, path, COMPETITOR_TOKEN)).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(status(HttpMethod.GET, path, READER_TOKEN)).isEqualTo(HttpStatus.FORBIDDEN);
            assertAllowed(status(HttpMethod.GET, path, "integration-test-token"));
        }
    }

    @Test
    void shouldReserveTournamentWritesForTheAdmin() {
        for (HttpMethod method : new HttpMethod[] {HttpMethod.POST, HttpMethod.PUT, HttpMethod.DELETE}) {
            for (String path : new String[] {
                ApiRoutes.TOURNAMENT,
                ApiRoutes.TOURNAMENT + ID + "/publish",
                ApiRoutes.TOURNAMENT + ID + "/division" + ID + "/result",
                ApiRoutes.TOURNAMENT + ID + "/registration" + ID + "/cancel"
            }) {
                assertThat(status(method, path, null)).isEqualTo(HttpStatus.UNAUTHORIZED);
                assertThat(status(method, path, COMPETITOR_TOKEN)).isEqualTo(HttpStatus.FORBIDDEN);
                assertAllowed(status(method, path, "integration-test-token"));
            }
        }
    }

    @Test
    void shouldReserveCompetitorRoutesForSignedInCompetitors() {
        record Call(HttpMethod method, String path) {}
        for (Call call : new Call[] {
            new Call(HttpMethod.GET, ApiRoutes.COMPETITOR + "/me"),
            new Call(HttpMethod.PUT, ApiRoutes.COMPETITOR + "/me"),
            new Call(HttpMethod.DELETE, ApiRoutes.COMPETITOR + "/me"),
            new Call(HttpMethod.GET, ApiRoutes.COMPETITOR + "/me/history"),
            new Call(HttpMethod.GET, ApiRoutes.REGISTRATION + "/me"),
            new Call(HttpMethod.POST, ApiRoutes.REGISTRATION),
            new Call(HttpMethod.POST, ApiRoutes.REGISTRATION + ID + "/cancel"),
            new Call(HttpMethod.PUT, ApiRoutes.REGISTRATION + ID + "/division"),
            new Call(HttpMethod.GET, ApiRoutes.TOURNAMENT + ID + "/eligible-division")
        }) {
            assertThat(status(call.method(), call.path(), null))
                    .as("anonymous %s %s", call.method(), call.path())
                    .isEqualTo(HttpStatus.UNAUTHORIZED);
            // The admin is not a competitor: the writer scope opens no competitor route.
            assertThat(status(call.method(), call.path(), "integration-test-token"))
                    .as("admin %s %s", call.method(), call.path())
                    .isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(status(call.method(), call.path(), COMPETITOR_TOKEN_WITHOUT_SCOPE))
                    .as("competitor tenant without scope %s %s", call.method(), call.path())
                    .isEqualTo(HttpStatus.FORBIDDEN);
            assertAllowed(status(call.method(), call.path(), COMPETITOR_TOKEN));
        }
    }

    /**
     * ADR-0012: a competitor is a principal from the competitor tenant. A workforce account that happens to carry an
     * app role named COMPETITOR is not one.
     */
    @Test
    void shouldNotTreatAWorkforceRoleNamedCompetitorAsACompetitor() {
        for (String path : new String[] {
            ApiRoutes.COMPETITOR + "/me",
            ApiRoutes.REGISTRATION + "/me",
            ApiRoutes.TOURNAMENT + ID + "/eligible-division"
        }) {
            assertThat(status(HttpMethod.GET, path, WORKFORCE_TOKEN_WITH_COMPETITOR_APP_ROLE))
                    .as(path)
                    .isEqualTo(HttpStatus.FORBIDDEN);
        }
    }

    /** Spring MVC serves HEAD through the GET handler, so the admin rule must not be GET-only. */
    @Test
    void shouldRefuseHeadOnAdminReadsToNonAdmins() {
        for (String path :
                new String[] {ApiRoutes.TOURNAMENT + "/admin", ApiRoutes.TOURNAMENT + ID + "/registration"}) {
            assertThat(status(HttpMethod.HEAD, path, null)).isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(status(HttpMethod.HEAD, path, COMPETITOR_TOKEN)).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(status(HttpMethod.HEAD, path, COMPETITOR_TOKEN_WITHOUT_SCOPE))
                    .isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(status(HttpMethod.HEAD, path, READER_TOKEN)).isEqualTo(HttpStatus.FORBIDDEN);
            assertAllowed(status(HttpMethod.HEAD, path, "integration-test-token"));
        }
        String eligible = ApiRoutes.TOURNAMENT + ID + "/eligible-division";
        assertThat(status(HttpMethod.HEAD, eligible, null)).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(status(HttpMethod.HEAD, eligible, "integration-test-token")).isEqualTo(HttpStatus.FORBIDDEN);
    }

    /**
     * "Authenticated" used to mean a workforce account. A self-registered competitor must not inherit the routes that
     * rule protects.
     */
    @Test
    void shouldNotLetCompetitorTokensSatisfyTheAuthenticatedFallback() {
        for (String path : new String[] {"/actuator/metrics", "/actuator/prometheus"}) {
            assertThat(status(HttpMethod.GET, path, null)).isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(status(HttpMethod.GET, path, COMPETITOR_TOKEN)).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(status(HttpMethod.GET, path, COMPETITOR_TOKEN_WITHOUT_SCOPE))
                    .isEqualTo(HttpStatus.FORBIDDEN);
            assertAllowed(status(HttpMethod.GET, path, READER_TOKEN));
        }
    }

    /** ADR-0013: Stripe presents no bearer token; the controller verifies its signature instead. */
    @Test
    void shouldLetTheStripeWebhookThroughWithoutABearerToken() {
        assertAllowed(status(HttpMethod.POST, ApiRoutes.STRIPE_WEBHOOK, null));
    }

    /** ADR-0014: outside local development there is no local sign-in, so nobody can obtain a token from the API. */
    @Test
    void shouldOfferNoLocalSignInOutsideLocalDevelopment() {
        var response =
                restTemplate.exchange(ApiRoutes.LOCAL_SIGN_IN, HttpMethod.POST, jsonEntity("", null), String.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).doesNotContain("accessToken");
    }

    private HttpStatusCode status(HttpMethod method, String path, String bearerToken) {
        return restTemplate
                .exchange(path, method, jsonEntity("{}", bearerToken), String.class)
                .getStatusCode();
    }

    private static void assertAllowed(HttpStatusCode status) {
        assertThat(status).isNotIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }
}
