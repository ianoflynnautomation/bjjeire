package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

/**
 * Who may call each kind of merch route (ADR-0016, specs/stc/shop/contract.yaml), with the Merch flag on.
 *
 * <p>These assert the security rules only. A caller who is let through reaches the controller, or a 404 while the route
 * has no controller yet, so "allowed" means neither 401 nor 403.
 */
class MerchRouteAuthorizationIT extends MongoIntegrationTest {
    private static final String ID = "/0123456789abcdef01234567";
    private static final String SHA256 = "/" + "a".repeat(64);

    @Test
    void shouldLetAnyoneReadTheCatalogue() {
        for (String path : new String[] {
            ApiRoutes.PRODUCT, ApiRoutes.PRODUCT + "/harp-rashguard", ApiRoutes.PRODUCT + "/photo" + SHA256
        }) {
            for (String token : new String[] {null, COMPETITOR_TOKEN}) {
                assertAllowed(status(HttpMethod.GET, path, token), "GET " + path);
            }
        }
    }

    /** #6012: a guest checks out and reads their order with no account; a competitor token changes nothing. */
    @Test
    @Tag("#6012")
    void shouldLetGuestsStartReadAndResumeAnOrderWithoutAToken() {
        record Call(HttpMethod method, String path) {}
        for (Call call : new Call[] {
            new Call(HttpMethod.POST, ApiRoutes.ORDER),
            new Call(HttpMethod.GET, ApiRoutes.ORDER + ID),
            new Call(HttpMethod.POST, ApiRoutes.ORDER + ID + "/checkout"),
            new Call(HttpMethod.GET, ApiRoutes.ORDER + "/delivery")
        }) {
            for (String token : new String[] {null, COMPETITOR_TOKEN}) {
                assertAllowed(status(call.method(), call.path(), token), call.method() + " " + call.path());
            }
        }
    }

    /** ADR-0016: Stripe presents no bearer token; the controller verifies its signature instead. */
    @Test
    void shouldLetTheShopWebhookThroughWithoutABearerToken() {
        assertAllowed(status(HttpMethod.POST, ApiRoutes.ORDER_STRIPE_WEBHOOK, null), "shop webhook");
    }

    /** #6017, #6025: only the organiser manages products, stock and orders, or sees the dashboard. */
    @Test
    @Tag("#6017")
    @Tag("#6025")
    void shouldReserveMerchAdminRoutesForTheOrganiser() {
        record Call(HttpMethod method, String path) {}
        for (Call call : new Call[] {
            new Call(HttpMethod.GET, ApiRoutes.PRODUCT + "/admin"),
            new Call(HttpMethod.GET, ApiRoutes.PRODUCT + "/admin" + ID),
            new Call(HttpMethod.POST, ApiRoutes.PRODUCT + "/admin"),
            new Call(HttpMethod.PUT, ApiRoutes.PRODUCT + "/admin" + ID),
            new Call(HttpMethod.POST, ApiRoutes.PRODUCT + "/admin" + ID + "/publish"),
            new Call(HttpMethod.POST, ApiRoutes.PRODUCT + "/admin" + ID + "/hide"),
            new Call(HttpMethod.PUT, ApiRoutes.PRODUCT + "/admin" + ID + "/stock"),
            new Call(HttpMethod.POST, ApiRoutes.PRODUCT + "/admin" + ID + "/photo"),
            new Call(HttpMethod.DELETE, ApiRoutes.PRODUCT + "/admin" + ID),
            new Call(HttpMethod.GET, ApiRoutes.ORDER + "/admin"),
            new Call(HttpMethod.POST, ApiRoutes.ORDER + "/admin" + ID + "/dispatch"),
            new Call(HttpMethod.POST, ApiRoutes.ORDER + "/admin" + ID + "/refund"),
            new Call(HttpMethod.GET, ApiRoutes.ORDER + "/admin/dashboard"),
            new Call(HttpMethod.GET, ApiRoutes.ORDER + "/admin/settings"),
            new Call(HttpMethod.PUT, ApiRoutes.ORDER + "/admin/settings"),
            // HEAD is served by the GET handler, so the admin rule must not be GET-only.
            new Call(HttpMethod.HEAD, ApiRoutes.PRODUCT + "/admin"),
            new Call(HttpMethod.HEAD, ApiRoutes.ORDER + "/admin")
        }) {
            String label = call.method() + " " + call.path();
            assertThat(status(call.method(), call.path(), null))
                    .as("anonymous %s", label)
                    .isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(status(call.method(), call.path(), COMPETITOR_TOKEN))
                    .as("competitor %s", label)
                    .isEqualTo(HttpStatus.FORBIDDEN);
            // Competitor tokens carry the writer scope's name in their scope claim; it must never map (ADR-0012).
            assertThat(status(call.method(), call.path(), COMPETITOR_TOKEN_WITHOUT_SCOPE))
                    .as("competitor tenant without scope %s", label)
                    .isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(status(call.method(), call.path(), READER_TOKEN))
                    .as("reader %s", label)
                    .isEqualTo(HttpStatus.FORBIDDEN);
            assertAllowed(status(call.method(), call.path(), "integration-test-token"), "organiser " + label);
        }
    }

    /**
     * The public patterns {@code /product/*} and {@code /order/*} also match {@code /admin}. The admin rules come
     * first, so the admin lists never become public reads.
     */
    @Test
    @Tag("#6017")
    @Tag("#6025")
    void shouldNotServeTheAdminListsThroughThePublicPatterns() {
        for (String path : new String[] {ApiRoutes.PRODUCT + "/admin", ApiRoutes.ORDER + "/admin"}) {
            assertThat(rawStatus(path)).as(path).isEqualTo(HttpStatus.UNAUTHORIZED);
        }
        // The firewall may refuse an encoded spelling outright; it must never reach a public rule.
        for (String path : new String[] {"/api/v1/%70roduct/admin", "/api/v1/%6frder/admin"}) {
            assertThat(rawStatus(path)).as(path).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.BAD_REQUEST);
        }
    }

    /** A URI object keeps the percent-encoding exactly as written. */
    private HttpStatusCode rawStatus(String path) {
        return restTemplate
                .exchange(
                        java.net.URI.create(restTemplate
                                        .getUriTemplateHandler()
                                        .expand("/")
                                        .toString()
                                        .replaceAll("/$", "")
                                + path),
                        HttpMethod.GET,
                        jsonEntity("{}", null),
                        String.class)
                .getStatusCode();
    }

    private HttpStatusCode status(HttpMethod method, String path, String bearerToken) {
        return restTemplate
                .exchange(path, method, jsonEntity("{}", bearerToken), String.class)
                .getStatusCode();
    }

    private static void assertAllowed(HttpStatusCode status, String label) {
        assertThat(status).as(label).isNotIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }
}
