package com.bjjeire.api.competitor;

import static com.bjjeire.api.competitor.CompetitorTestData.profileJson;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/** A profile is private to its owner: no other competitor, visitor or organiser route reaches it (#5009, FR-011). */
class CompetitorPrivacyIT extends MongoIntegrationTest {
    private static final String ME = ApiRoutes.COMPETITOR + "/me";
    private static final String AOIFE = competitorToken("aoife");
    private static final String BRIAN = competitorToken("brian");

    @Autowired
    @Qualifier("requestMappingHandlerMapping") private RequestMappingHandlerMapping handlerMapping;

    @Test
    @Tag("#5009")
    void shouldNeverShowOneCompetitorAnotherCompetitorsProfile() {
        put(profileJson("Aoife"), AOIFE);

        assertThat(exchange(HttpMethod.GET, null, BRIAN).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(exchange(HttpMethod.GET, null, BRIAN).getBody()).doesNotContain("Aoife");
    }

    @Test
    @Tag("#5009")
    void shouldNeverLetOneCompetitorChangeOrDeleteAnotherCompetitorsProfile() {
        put(profileJson("Aoife"), AOIFE);

        put(profileJson("Brian"), BRIAN);
        exchange(HttpMethod.DELETE, null, BRIAN);

        assertThat(exchange(HttpMethod.GET, null, AOIFE).getBody()).contains("\"firstName\":\"Aoife\"");
        assertThat(mongoTemplate.findAll(Competitor.class))
                .extracting(Competitor::getSubject)
                .containsExactly("aoife");
    }

    @Test
    @Tag("#5009")
    void shouldRefuseVisitorsAndTheOrganiser() {
        put(profileJson("Aoife"), AOIFE);

        for (HttpMethod method : new HttpMethod[] {HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE}) {
            assertThat(exchange(method, profileJson("Visitor"), null).getStatusCode())
                    .as("anonymous %s", method)
                    .isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(exchange(method, profileJson("Organiser"), "integration-test-token")
                            .getStatusCode())
                    .as("organiser %s", method)
                    .isEqualTo(HttpStatus.FORBIDDEN);
        }
        assertThat(restTemplate
                        .exchange(ME + "/history", HttpMethod.GET, jsonEntity(null, null), String.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(mongoTemplate.findAll(Competitor.class))
                .singleElement()
                .extracting(Competitor::getFirstName)
                .isEqualTo("Aoife");
    }

    @Test
    @Tag("#5009")
    void shouldOfferNoRouteThatNamesACompetitor() {
        assertThat(handlerMapping.getHandlerMethods().keySet().stream()
                        .map(RequestMappingInfo::getPatternValues)
                        .flatMap(java.util.Set::stream)
                        .filter(pattern -> pattern.startsWith(ApiRoutes.COMPETITOR))
                        .distinct())
                .containsExactlyInAnyOrder(ME, ME + "/history");
    }

    private void put(String body, String token) {
        assertThat(exchange(HttpMethod.PUT, body, token).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private org.springframework.http.ResponseEntity<String> exchange(HttpMethod method, String body, String token) {
        return restTemplate.exchange(ME, method, jsonEntity(body, token), String.class);
    }
}
