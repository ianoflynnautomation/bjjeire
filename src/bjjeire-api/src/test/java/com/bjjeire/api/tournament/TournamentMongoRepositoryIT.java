package com.bjjeire.api.tournament;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.time.LocalDate;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

class TournamentMongoRepositoryIT extends MongoIntegrationTest {
    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldRejectASecondTournamentWithTheSameSlug() {
        tournamentRepository.insert(tournament("bjjeire", TournamentStatus.DRAFT, "2026-06-27"));

        assertThatThrownBy(
                        () -> tournamentRepository.insert(tournament("bjjeire", TournamentStatus.DRAFT, "2026-07-27")))
                .isInstanceOf(DuplicateKeyException.class);
    }

    @Test
    @Tag("#5001")
    @Tag("#5002")
    void shouldListOnlyPublishedFinishedAndCancelledTournamentsOrderedByDate() throws Exception {
        tournamentRepository.insert(tournament("autumn", TournamentStatus.PUBLISHED, "2026-09-12"));
        tournamentRepository.insert(tournament("spring", TournamentStatus.FINISHED, "2026-03-14"));
        tournamentRepository.insert(tournament("summer", TournamentStatus.CANCELLED, "2026-06-27"));
        tournamentRepository.insert(tournament("hidden", TournamentStatus.DRAFT, "2026-01-10"));

        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.TOURNAMENT + "?page=1&pageSize=20", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(3);
        assertThat(body.at("/data").valueStream().map(item -> item.at("/slug").asString()))
                .containsExactly("spring", "summer", "autumn");
        assertThat(response.getBody()).doesNotContain("hidden");
    }

    @Test
    @Tag("#5001")
    void shouldNotServeADraftBySlug() {
        tournamentRepository.insert(tournament("hidden", TournamentStatus.DRAFT, "2026-06-27"));

        ResponseEntity<String> response = restTemplate.getForEntity(ApiRoutes.TOURNAMENT + "/hidden", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private static Tournament tournament(String slug, TournamentStatus status, String date) {
        return TournamentTestData.tournament(slug, status, LocalDate.parse(date));
    }
}
