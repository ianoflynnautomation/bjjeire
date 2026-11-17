package com.bjjeire.api.bjjeirecompetition;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.competitor.CompetitorAccountDeleting;
import com.bjjeire.api.registration.BjjEireCompetitionRegistration;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** The public leaderboard: podiums, both rankings and winners, always current (FR-032 to FR-035, FR-040, SC-006). */
class LeaderboardIT extends ResultsIntegrationTest {
    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ApplicationEventPublisher events;

    @Test
    @Tag("#5034")
    void shouldServeEmptyPodiumsAndRankingsBeforeAnyResult() throws Exception {
        BjjEireCompetition competition = publishedWith("empty", BjjEireCompetitionTestData.division("-76 kg"));

        ResponseEntity<String> response = leaderboard(competition.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/podiums").size()).isZero();
        assertThat(body.at("/academyRanking").size()).isZero();
        assertThat(body.at("/affiliationRanking").size()).isZero();
        assertThat(body.has("winners")).isFalse();
    }

    @Test
    @Tag("#5028")
    @Tag("#5029")
    @Tag("#5040")
    void shouldShowPodiumsAndBothRankingsToAVisitor() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("ranked", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", "Alliance");
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "Team Y", "Alliance");
        String niamh = confirmed(competition, division, "Niamh Byrne", "Team X", "Checkmat");
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, ciaran, niamh);

        JsonNode body = objectMapper.readTree(leaderboard(competition.getId()).getBody());

        assertThat(body.at("/podiums/0/divisionId").asString()).isEqualTo(division.getId());
        assertThat(body.at("/podiums/0/gold/displayName").asString()).isEqualTo("Aoife Byrne");
        assertThat(body.at("/podiums/0/gold/academy").asString()).isEqualTo("Team X");
        assertThat(body.at("/podiums/0/silver/displayName").asString()).isEqualTo("Ciaran Byrne");
        assertThat(body.at("/podiums/0/bronzes/0/displayName").asString()).isEqualTo("Niamh Byrne");
        assertThat(body.at("/academyRanking/0/name").asString()).isEqualTo("Team X");
        assertThat(body.at("/academyRanking/0/points").asInt()).isEqualTo(10);
        assertThat(body.at("/academyRanking/1/name").asString()).isEqualTo("Team Y");
        assertThat(body.at("/affiliationRanking/0/name").asString()).isEqualTo("Alliance");
        assertThat(body.at("/affiliationRanking/0/points").asInt()).isEqualTo(12);
        assertThat(body.at("/affiliationRanking/1/name").asString()).isEqualTo("Checkmat");
    }

    @Test
    @Tag("#5041")
    void shouldNameTheWinnersOnceTheCompetitionIsFinished() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("winners", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", "Alliance");
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "Team Y", "Checkmat");
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, ciaran);
        assertThat(objectMapper
                        .readTree(leaderboard(competition.getId()).getBody())
                        .has("winners"))
                .isFalse();

        finish(ADMIN_TOKEN, competition.getId());

        JsonNode body = objectMapper.readTree(leaderboard(competition.getId()).getBody());
        assertThat(body.at("/winners/academies/0").asString()).isEqualTo("Team X");
        assertThat(body.at("/winners/affiliations/0").asString()).isEqualTo("Alliance");
    }

    @Test
    @Tag("#5033")
    void shouldReflectACorrectionOnTheNextRead() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("corrected", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "Team Y", null);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, ciaran);
        assertThat(firstAcademy(competition)).isEqualTo("Team X");

        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), ciaran, aoife);

        assertThat(firstAcademy(competition)).isEqualTo("Team Y");

        clearResult(ADMIN_TOKEN, competition.getId(), division.getId());

        assertThat(objectMapper
                        .readTree(leaderboard(competition.getId()).getBody())
                        .at("/podiums")
                        .size())
                .isZero();
    }

    @Test
    @Tag("#5029")
    void shouldReflectATeamMergeOnTheNextRead() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("merged", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "team x dublin", null);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, ciaran);
        assertThat(objectMapper
                        .readTree(leaderboard(competition.getId()).getBody())
                        .at("/academyRanking")
                        .size())
                .isEqualTo(2);

        ResponseEntity<String> merged = restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competition.getId() + "/team-merge",
                HttpMethod.POST,
                jsonEntity("""
                        { "kind": "ACADEMY", "fromKeys": ["name:team x dublin"], "target": "Team X" }
                        """, ADMIN_TOKEN),
                String.class);
        assertThat(merged.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode ranking = objectMapper
                .readTree(leaderboard(competition.getId()).getBody())
                .at("/academyRanking");
        assertThat(ranking.size()).isEqualTo(1);
        assertThat(ranking.at("/0/points").asInt()).isEqualTo(12);
    }

    @Test
    @Tag("#5032")
    void shouldKeepPointsWhenACompetitorCancelsAfterTheResultWasRecorded() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("cancelled-out", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "Team Y", null);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, null);
        assertThat(firstAcademy(competition)).isEqualTo("Team X");

        ResponseEntity<String> cancelled = restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competition.getId() + "/registration/" + ciaran + "/cancel",
                HttpMethod.POST,
                jsonEntity("{ \"refund\": false }", ADMIN_TOKEN),
                String.class);
        assertThat(cancelled.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Two competitors took part when the result was recorded; a later cancellation changes nothing (FR-035).
        JsonNode body = objectMapper.readTree(leaderboard(competition.getId()).getBody());
        assertThat(body.at("/podiums/0/gold/displayName").asString()).isEqualTo("Aoife Byrne");
        assertThat(body.at("/podiums/0/pointsAwarded").asBoolean()).isTrue();
        assertThat(body.at("/academyRanking/0/points").asInt()).isEqualTo(9);
    }

    @Test
    @Tag("#5032")
    void shouldAwardNoPointsWhenTheResultIsRecordedWithOneConfirmedCompetitor() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("alone", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", "Alliance");

        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, null);

        JsonNode body = objectMapper.readTree(leaderboard(competition.getId()).getBody());
        assertThat(body.at("/podiums/0/gold/displayName").asString()).isEqualTo("Aoife Byrne");
        assertThat(body.at("/podiums/0/pointsAwarded").asBoolean()).isFalse();
        assertThat(body.at("/academyRanking").size()).isZero();
        assertThat(body.at("/affiliationRanking").size()).isZero();
    }

    @Test
    @Tag("#5033")
    void shouldCountTheCompetitorsAgainWhenTheOrganiserCorrectsTheResult() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("recount", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "Team Y", null);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, null);
        restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competition.getId() + "/registration/" + ciaran + "/cancel",
                HttpMethod.POST,
                jsonEntity("{ \"refund\": false }", ADMIN_TOKEN),
                String.class);

        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, null);

        assertThat(objectMapper
                        .readTree(leaderboard(competition.getId()).getBody())
                        .at("/podiums/0/pointsAwarded")
                        .asBoolean())
                .isFalse();
    }

    @Test
    @Tag("#5032")
    void shouldKeepPointsWhenACompetitorIsMovedAfterTheResultWasRecorded() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        Division other = BjjEireCompetitionTestData.division("-82 kg");
        BjjEireCompetition competition = publishedWith("moved", division, other);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "Team Y", null);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, null);
        assertThat(firstAcademy(competition)).isEqualTo("Team X");

        ResponseEntity<String> moved = restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competition.getId() + "/registration/" + ciaran + "/division",
                HttpMethod.PUT,
                jsonEntity("{ \"divisionId\": \"" + other.getId() + "\" }", ADMIN_TOKEN),
                String.class);
        assertThat(moved.getStatusCode()).isEqualTo(HttpStatus.OK);

        assertThat(objectMapper
                        .readTree(leaderboard(competition.getId()).getBody())
                        .at("/academyRanking/0/points")
                        .asInt())
                .isEqualTo(9);
    }

    @Test
    void shouldNotServeTheLeaderboardOfACancelledCompetition() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("cancelled-board", division);
        mongoTemplate.updateFirst(
                org.springframework.data.mongodb.core.query.Query.query(
                        org.springframework.data.mongodb.core.query.Criteria.where("_id")
                                .is(competition.getId())),
                org.springframework.data.mongodb.core.query.Update.update("status", BjjEireCompetitionStatus.CANCELLED),
                BjjEireCompetition.class);

        assertThat(leaderboard(competition.getId()).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void shouldCarryNoPrivateFieldInThePublicJson() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("private-board", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", "Alliance");
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "Team Y", null);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, ciaran);
        finish(ADMIN_TOKEN, competition.getId());

        String json = leaderboard(competition.getId()).getBody();

        assertThat(json).contains("Aoife Byrne");
        for (String field : List.of(
                "email",
                "dateOfBirth",
                "phone",
                "address",
                "nationality",
                "competitorId",
                "payment",
                "registrationId",
                aoife,
                ciaran)) {
            assertThat(json).doesNotContainIgnoringCase(field);
        }
    }

    @Test
    void shouldKeepADeletedCompetitorsMedalAndPointsUnderThePlaceholderName() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("deleted", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", "Alliance");
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "Team Y", null);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, ciaran);
        leaderboard(competition.getId());

        String competitorId = mongoTemplate
                .findById(aoife, BjjEireCompetitionRegistration.class)
                .getCompetitorId();
        events.publishEvent(new CompetitorAccountDeleting(competitorId));

        JsonNode body = objectMapper.readTree(leaderboard(competition.getId()).getBody());
        assertThat(body.at("/podiums/0/gold/displayName").asString())
                .isEqualTo(BjjEireCompetitionRegistration.DELETED_DISPLAY_NAME);
        assertThat(body.at("/academyRanking/0/name").asString()).isEqualTo("Team X");
        assertThat(body.at("/academyRanking/0/points").asInt()).isEqualTo(9);
    }

    @Test
    void shouldNotServeTheLeaderboardOfADraftOrAnUnknownCompetition() {
        BjjEireCompetition draft = mongoTemplate.insert(BjjEireCompetitionTestData.competition(
                "draft-board", BjjEireCompetitionStatus.DRAFT, LocalDate.of(2026, 6, 27)));

        assertThat(leaderboard(draft.getId()).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(leaderboard("665f1c2b9b1e8a0012345678").getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private String firstAcademy(BjjEireCompetition competition) throws Exception {
        return objectMapper
                .readTree(leaderboard(competition.getId()).getBody())
                .at("/academyRanking/0/name")
                .asString();
    }
}
