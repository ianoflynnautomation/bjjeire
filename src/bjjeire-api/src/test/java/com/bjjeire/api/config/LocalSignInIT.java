package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.time.Clock;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * ADR-0014 in the assembled application: local sign-in switched on under the local profile, as the local compose stack
 * runs. This class costs a second application context.
 */
@ActiveProfiles("local")
@TestPropertySource(
        properties = {"bjjeire.local-sign-in.enabled=true", "bjjeire.local-sign-in.secret=" + LocalSignInIT.SECRET})
class LocalSignInIT extends MongoIntegrationTest {
    static final String SECRET = "local-development-only-0123456789abcdef";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldLetALocalOrganiserCreateAndListTournaments() throws Exception {
        String token = signIn();

        ResponseEntity<String> created =
                restTemplate.postForEntity(ApiRoutes.TOURNAMENT, jsonEntity(tournamentJson(), token), String.class);
        ResponseEntity<String> drafts = restTemplate.exchange(
                ApiRoutes.TOURNAMENT + "/admin", HttpMethod.GET, jsonEntity(null, token), String.class);

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(drafts.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(drafts.getBody()).contains("local-sign-in-cup");
    }

    @Test
    void shouldNeverTreatALocalOrganiserAsACompetitor() throws Exception {
        ResponseEntity<String> response = restTemplate.exchange(
                ApiRoutes.COMPETITOR + "/me", HttpMethod.GET, jsonEntity(null, signIn()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void shouldLetALocalCompetitorKeepAProfile() throws Exception {
        String token = signInCompetitor("aoife@example.test");

        ResponseEntity<String> saved = restTemplate.exchange(
                ApiRoutes.COMPETITOR + "/me",
                HttpMethod.PUT,
                jsonEntity(
                        "{ \"firstName\": \"Aoife\", \"lastName\": \"Byrne\", \"dateOfBirth\": \"1990-04-12\" }",
                        token),
                String.class);

        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(saved.getBody()).at("/email").asString())
                .isEqualTo("aoife@example.test");
    }

    /** The owner's defect report: after deleting the account, signing up again with the same email works. */
    @Test
    void shouldLetALocalCompetitorSignUpAgainWithTheSameEmailAfterDeleting() throws Exception {
        String first = signInCompetitor("again@example.test");
        restTemplate.exchange(
                ApiRoutes.COMPETITOR + "/me",
                HttpMethod.PUT,
                jsonEntity(
                        "{ \"firstName\": \"Aoife\", \"lastName\": \"Byrne\", \"dateOfBirth\": \"1990-04-12\" }",
                        first),
                String.class);
        restTemplate.exchange(ApiRoutes.COMPETITOR + "/me", HttpMethod.DELETE, jsonEntity(null, first), String.class);

        String again = signInCompetitor("again@example.test");

        assertThat(restTemplate
                        .exchange(ApiRoutes.COMPETITOR + "/me", HttpMethod.GET, jsonEntity(null, again), String.class)
                        .getBody())
                .contains("\"saved\":false")
                .doesNotContain("Aoife");
    }

    /** A local competitor is a competitor and nothing more: no tournament set-up, no directory write. */
    @Test
    void shouldNeverTreatALocalCompetitorAsAnOrganiser() throws Exception {
        String token = signInCompetitor("aoife@example.test");

        assertThat(restTemplate
                        .postForEntity(ApiRoutes.TOURNAMENT, jsonEntity(tournamentJson(), token), String.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(restTemplate
                        .exchange(
                                ApiRoutes.TOURNAMENT + "/admin", HttpMethod.GET, jsonEntity(null, token), String.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(restTemplate
                        .postForEntity(ApiRoutes.GYM, jsonEntity("{}", token), String.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void shouldRefuseALocalCompetitorSignInWithoutAValidEmail() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                ApiRoutes.LOCAL_SIGN_IN + "/competitor",
                jsonEntity("{ \"email\": \"not an email\" }", null),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void shouldRejectALocalTokenSignedWithAnotherSecret() {
        String forged = LocalSignInTokens.issue(
                        "someone-elses-secret-0123456789abcdef", "access_as_writer", Clock.systemUTC())
                .accessToken();

        ResponseEntity<String> response =
                restTemplate.postForEntity(ApiRoutes.TOURNAMENT, jsonEntity(tournamentJson(), forged), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private String signIn() throws Exception {
        ResponseEntity<String> response =
                restTemplate.postForEntity(ApiRoutes.LOCAL_SIGN_IN, jsonEntity("", null), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/expiresAt").asString()).isNotBlank();
        return body.at("/accessToken").asString();
    }

    private String signInCompetitor(String email) throws Exception {
        ResponseEntity<String> response = restTemplate.postForEntity(
                ApiRoutes.LOCAL_SIGN_IN + "/competitor",
                jsonEntity("{ \"email\": \"" + email + "\" }", null),
                String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return objectMapper.readTree(response.getBody()).at("/accessToken").asString();
    }

    private static String tournamentJson() {
        return """
            {
              "slug": "local-sign-in-cup",
              "name": "Local Sign-in Cup",
              "date": "2026-06-27",
              "venue": { "venue": "National Arena" },
              "entryFeeCents": 2500,
              "registrationOpensAt": "2026-06-01T09:00:00Z",
              "registrationClosesAt": "2026-06-20T20:00:00Z",
              "divisions": []
            }
            """;
    }
}
