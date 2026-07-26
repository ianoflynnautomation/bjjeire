package com.bjjeire.api.competition;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

class CompetitionMongoRepositoryIT extends MongoIntegrationTest {
    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void seedCompetitions() {
        competitionRepository.save(
                competition("future-open", "Future Open", true, "2026-08-01T09:00:00Z", "2026-08-02T18:00:00Z"));
        competitionRepository.save(
                competition("expired-open", "Expired Open", true, "2026-01-01T09:00:00Z", "2026-01-02T18:00:00Z"));
        competitionRepository.save(
                competition("inactive-open", "Inactive Open", false, "2026-09-01T09:00:00Z", "2026-09-02T18:00:00Z"));
    }

    @Test
    void shouldExcludeExpiredAndInactiveCompetitionsWhenListingByDefault() throws Exception {
        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.COMPETITION + "?page=1&pageSize=20", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/data/0/slug").asText()).isEqualTo("future-open");
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(1);
    }

    @Test
    void shouldIncludeExpiredAndInactiveCompetitionsWhenRequested() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(
                ApiRoutes.COMPETITION + "?includeInactive=true&page=1&pageSize=20", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(3);
    }

    private static Competition competition(
            String slug, String name, boolean isActive, String startDate, String endDate) {
        Competition competition = new Competition();
        competition.setSlug(slug);
        competition.setName(name);
        competition.setOrganisation("IBJJF");
        competition.setCountry("Ireland");
        competition.setWebsiteUrl("https://example.com/" + slug);
        competition.setStartDate(Instant.parse(startDate));
        competition.setEndDate(Instant.parse(endDate));
        competition.setActive(isActive);
        return competition;
    }
}
