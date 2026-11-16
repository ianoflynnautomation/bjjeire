package com.bjjeire.api.bjjeirecompetition;

import static com.bjjeire.api.testsupport.RetiredNames.OLD_NAME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.time.LocalDate;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

class BjjEireCompetitionMongoRepositoryIT extends MongoIntegrationTest {
    @Autowired
    private BjjEireCompetitionRepository bjjEireCompetitionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldRejectASecondBjjEireCompetitionWithTheSameSlug() {
        bjjEireCompetitionRepository.insert(competition("bjjeire", BjjEireCompetitionStatus.DRAFT, "2026-06-27"));

        assertThatThrownBy(() -> bjjEireCompetitionRepository.insert(
                        competition("bjjeire", BjjEireCompetitionStatus.DRAFT, "2026-07-27")))
                .isInstanceOf(DuplicateKeyException.class);
    }

    /** FIXED_NOW is 2026-05-31T00:00Z, 01:00 on 31 May in Dublin. */
    @Test
    @Tag("#3006")
    @Tag("#3007")
    @Tag("#5002")
    void shouldListOnlyUpcomingPublishedBjjEireCompetitionsEarliestDayThenName() throws Exception {
        bjjEireCompetitionRepository.insert(competition("autumn", BjjEireCompetitionStatus.PUBLISHED, "2026-09-12"));
        bjjEireCompetitionRepository.insert(competition("today-b", BjjEireCompetitionStatus.PUBLISHED, "2026-05-31"));
        bjjEireCompetitionRepository.insert(competition("today-a", BjjEireCompetitionStatus.PUBLISHED, "2026-05-31"));
        bjjEireCompetitionRepository.insert(competition("passed", BjjEireCompetitionStatus.PUBLISHED, "2026-05-30"));
        bjjEireCompetitionRepository.insert(competition("finished", BjjEireCompetitionStatus.FINISHED, "2026-07-14"));
        bjjEireCompetitionRepository.insert(competition("cancelled", BjjEireCompetitionStatus.CANCELLED, "2026-06-27"));
        bjjEireCompetitionRepository.insert(competition("hidden", BjjEireCompetitionStatus.DRAFT, "2026-06-10"));

        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.BJJEIRE_COMPETITION + "?page=1&pageSize=20", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(3);
        assertThat(body.at("/data").valueStream().map(item -> item.at("/slug").asString()))
                .containsExactly("today-a", "today-b", "autumn");
    }

    /** A finished, cancelled or passed competition leaves the list but keeps its page (#3009, edge cases). */
    @Test
    @Tag("#3009")
    void shouldStillServeAFinishedCancelledOrPassedCompetitionBySlug() {
        bjjEireCompetitionRepository.insert(competition("passed", BjjEireCompetitionStatus.PUBLISHED, "2026-05-30"));
        bjjEireCompetitionRepository.insert(competition("finished", BjjEireCompetitionStatus.FINISHED, "2026-03-14"));
        bjjEireCompetitionRepository.insert(competition("cancelled", BjjEireCompetitionStatus.CANCELLED, "2026-06-27"));

        for (String slug : new String[] {"passed", "finished", "cancelled"}) {
            assertThat(restTemplate
                            .getForEntity(ApiRoutes.BJJEIRE_COMPETITION + "/" + slug, String.class)
                            .getStatusCode())
                    .isEqualTo(HttpStatus.OK);
        }
    }

    /**
     * #3016, FR-010: the old prefix answers exactly as an address that never existed. The security catch-all asks an
     * anonymous caller to sign in first (401), and a signed-in organiser gets 404. Nothing redirects.
     */
    @Test
    @Tag("#3016")
    void shouldAnswerAtTheOldRoutesAsAtAnAddressThatNeverExisted() {
        bjjEireCompetitionRepository.insert(competition("bjjeire", BjjEireCompetitionStatus.PUBLISHED, "2026-06-27"));
        HttpStatusCode unknownAnonymous = restTemplate
                .getForEntity("/api/v1/no-such-feature", String.class)
                .getStatusCode();

        for (String path : new String[] {"/api/v1/" + OLD_NAME, "/api/v1/" + OLD_NAME + "/bjjeire"}) {
            ResponseEntity<String> anonymous = restTemplate.getForEntity(path, String.class);
            ResponseEntity<String> organiser =
                    restTemplate.exchange(path, HttpMethod.GET, jsonEntity(null), String.class);

            assertThat(anonymous.getStatusCode()).as(path).isEqualTo(unknownAnonymous);
            assertThat(organiser.getStatusCode()).as(path).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(anonymous.getHeaders().getLocation()).as(path).isNull();
            assertThat(organiser.getHeaders().getLocation()).as(path).isNull();
        }
        ResponseEntity<String> post =
                restTemplate.exchange("/api/v1/" + OLD_NAME, HttpMethod.POST, jsonEntity("{}"), String.class);
        assertThat(post.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @Tag("#5001")
    void shouldNotServeADraftBySlug() {
        bjjEireCompetitionRepository.insert(competition("hidden", BjjEireCompetitionStatus.DRAFT, "2026-06-27"));

        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.BJJEIRE_COMPETITION + "/hidden", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private static BjjEireCompetition competition(String slug, BjjEireCompetitionStatus status, String date) {
        return BjjEireCompetitionTestData.competition(slug, status, LocalDate.parse(date));
    }
}
