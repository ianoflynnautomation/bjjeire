package com.bjjeire.api.bjjeirecompetition;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.registration.RegistrationStatus;
import java.time.LocalDate;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Recording, correcting and clearing a division's podium (FR-031, #5028, #5033, #5035). */
class DivisionResultIT extends ResultsIntegrationTest {
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5028")
    void shouldRecordGoldSilverAndTwoBronzesFromTheDivisionsConfirmedCompetitors() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("record", division);
        String gold = confirmed(competition, division, "Aoife Byrne", "Team X", "Alliance");
        String silver = confirmed(competition, division, "Ciaran Byrne", "Team Y", "Alliance");
        String bronze1 = confirmed(competition, division, "Niamh Byrne", "Team Z", null);
        String bronze2 = confirmed(competition, division, "Sean Byrne", null, null);

        ResponseEntity<String> response =
                recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), gold, silver, bronze1, bronze2);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/divisionId").asString()).isEqualTo(division.getId());
        assertThat(body.at("/result/goldRegistrationId").asString()).isEqualTo(gold);
        assertThat(body.at("/result/silverRegistrationId").asString()).isEqualTo(silver);
        assertThat(body.at("/result/bronzeRegistrationIds").size()).isEqualTo(2);
        DivisionResult stored = mongoTemplate
                .findById(competition.getId(), BjjEireCompetition.class)
                .getDivisions()
                .getFirst()
                .getResult();
        assertThat(stored.getGoldRegistrationId()).isEqualTo(gold);
        assertThat(stored.getBronzeRegistrationIds()).containsExactly(bronze1, bronze2);
        assertThat(stored.getRecordedAt()).isEqualTo(FIXED_NOW);
        assertThat(stored.getConfirmedCompetitors()).isEqualTo(4);
        assertThat(stored.getRecordedBy()).isEqualTo(AUTHENTICATED_USER);
    }

    @Test
    @Tag("#5028")
    void shouldRecordAGoldAlone() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("gold-only", division);
        String gold = confirmed(competition, division, "Aoife Byrne", "Team X", null);

        assertThat(recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), gold, null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    @Tag("#5028")
    void shouldRefuseAMedallistWhoIsNotConfirmedInThatDivision() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        Division other = BjjEireCompetitionTestData.division("-82 kg");
        BjjEireCompetition competition = publishedWith("not-in", division, other);
        String gold = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        String elsewhere = confirmed(competition, other, "Ciaran Byrne", "Team Y", null);
        String unpaid = insertRegistration(
                competition, division, "Niamh Byrne", null, null, RegistrationStatus.AWAITING_PAYMENT);
        String cancelled =
                insertRegistration(competition, division, "Sean Byrne", null, null, RegistrationStatus.CANCELLED);

        for (String wrong : new String[] {elsewhere, unpaid, cancelled, "665f1c2b9b1e8a0012345678"}) {
            ResponseEntity<String> response =
                    recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), gold, wrong);
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(response.getBody()).contains("urn:bjjeire:not-in-division");
        }
        assertThat(mongoTemplate
                        .findById(competition.getId(), BjjEireCompetition.class)
                        .getDivisions()
                        .getFirst()
                        .getResult())
                .isNull();
    }

    @Test
    @Tag("#5028")
    void shouldRefuseTheSameCompetitorTwice() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("twice", division);
        String gold = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        String silver = confirmed(competition, division, "Ciaran Byrne", "Team Y", null);

        ResponseEntity<String> goldAndSilver =
                recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), gold, gold);
        ResponseEntity<String> twoBronzes =
                recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), gold, null, silver, silver);

        assertThat(goldAndSilver.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(goldAndSilver.getBody()).contains("urn:bjjeire:duplicate-medallist");
        assertThat(twoBronzes.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(twoBronzes.getBody()).contains("urn:bjjeire:duplicate-medallist");
    }

    @Test
    @Tag("#5028")
    void shouldRefuseMoreThanTwoBronzesOrNoGold() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("bronzes", division);
        String a = confirmed(competition, division, "A Byrne", null, null);
        String b = confirmed(competition, division, "B Byrne", null, null);
        String c = confirmed(competition, division, "C Byrne", null, null);
        String d = confirmed(competition, division, "D Byrne", null, null);

        assertThat(recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), a, null, b, c, d)
                        .getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), null, b)
                        .getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @Tag("#5033")
    void shouldReplaceARecordedResultWhenTheOrganiserCorrectsIt() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("correct", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "Team Y", null);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, ciaran);

        assertThat(recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), ciaran, aoife)
                        .getStatusCode())
                .isEqualTo(HttpStatus.OK);

        DivisionResult stored = mongoTemplate
                .findById(competition.getId(), BjjEireCompetition.class)
                .getDivisions()
                .getFirst()
                .getResult();
        assertThat(stored.getGoldRegistrationId()).isEqualTo(ciaran);
        assertThat(stored.getSilverRegistrationId()).isEqualTo(aoife);
    }

    @Test
    @Tag("#5033")
    void shouldClearAResult() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("clear", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, null);

        assertThat(clearResult(ADMIN_TOKEN, competition.getId(), division.getId())
                        .getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);

        assertThat(mongoTemplate
                        .findById(competition.getId(), BjjEireCompetition.class)
                        .getDivisions()
                        .getFirst()
                        .getResult())
                .isNull();
    }

    @Test
    @Tag("#5033")
    void shouldKeepAResultWhenTheOrganiserSavesTheCompetitionDetails() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("keep", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, null);
        long version = mongoTemplate
                .findById(competition.getId(), BjjEireCompetition.class)
                .getVersion();

        String body = BjjEireCompetitionTestData.commandJson(
                        "keep",
                        "2026-05-01T09:00:00Z",
                        "2026-06-20T20:00:00Z",
                        "[" + BjjEireCompetitionTestData.divisionJson(division.getId(), "-76 kg") + "]")
                .replaceFirst("\\{", "{ \"version\": " + version + ",");
        ResponseEntity<String> saved = restTemplate.exchange(
                com.bjjeire.api.common.ApiRoutes.BJJEIRE_COMPETITION + "/" + competition.getId(),
                org.springframework.http.HttpMethod.PUT,
                jsonEntity(body, ADMIN_TOKEN),
                String.class);

        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(mongoTemplate
                        .findById(competition.getId(), BjjEireCompetition.class)
                        .getDivisions()
                        .getFirst()
                        .getResult()
                        .getGoldRegistrationId())
                .isEqualTo(aoife);
    }

    @Test
    @Tag("#5035")
    void shouldRefuseCompetitorsAndAnonymousCallers() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("refuse", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", null);

        assertThat(recordResult(COMPETITOR_TOKEN, competition.getId(), division.getId(), aoife, null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(recordResult(null, competition.getId(), division.getId(), aoife, null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(recordResult(READER_TOKEN, competition.getId(), division.getId(), aoife, null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(clearResult(COMPETITOR_TOKEN, competition.getId(), division.getId())
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(finish(COMPETITOR_TOKEN, competition.getId()).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(finish(null, competition.getId()).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(resultsForAdmin(COMPETITOR_TOKEN, competition.getId()).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(resultsForAdmin(null, competition.getId()).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(mongoTemplate
                        .findById(competition.getId(), BjjEireCompetition.class)
                        .getDivisions()
                        .getFirst()
                        .getResult())
                .isNull();
    }

    @Test
    void shouldRefuseAResultOnADraftOrCancelledCompetitionAndAnUnknownDivision() {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition draft = mongoTemplate.insert(BjjEireCompetitionTestData.competition(
                "draft-result", BjjEireCompetitionStatus.DRAFT, LocalDate.of(2026, 6, 27)));
        BjjEireCompetition competition = publishedWith("unknown-division", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", null, null);

        assertThat(recordResult(
                                ADMIN_TOKEN,
                                draft.getId(),
                                draft.getDivisions().getFirst().getId(),
                                aoife,
                                null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
        assertThat(recordResult(ADMIN_TOKEN, competition.getId(), "665f1c2b9b1e8a0012345678", aoife, null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @Tag("#5041")
    void shouldFinishAPublishedCompetitionAndStillAllowCorrections() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        BjjEireCompetition competition = publishedWith("finish", division);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", null);
        String ciaran = confirmed(competition, division, "Ciaran Byrne", "Team Y", null);

        ResponseEntity<String> finished = finish(ADMIN_TOKEN, competition.getId());

        assertThat(finished.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(finished.getBody()).at("/status").asString())
                .isEqualTo("FINISHED");
        assertThat(finish(ADMIN_TOKEN, competition.getId()).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, ciaran)
                        .getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    void shouldRefuseToFinishADraftOrCancelledCompetition() {
        BjjEireCompetition draft = mongoTemplate.insert(BjjEireCompetitionTestData.competition(
                "draft-finish", BjjEireCompetitionStatus.DRAFT, LocalDate.of(2026, 6, 27)));
        BjjEireCompetition cancelled = mongoTemplate.insert(BjjEireCompetitionTestData.competition(
                "cancelled-finish", BjjEireCompetitionStatus.CANCELLED, LocalDate.of(2026, 6, 27)));

        assertThat(finish(ADMIN_TOKEN, draft.getId()).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(finish(ADMIN_TOKEN, cancelled.getId()).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(finish(ADMIN_TOKEN, "665f1c2b9b1e8a0012345678").getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @Tag("#5028")
    void shouldListEachDivisionsConfirmedCompetitorsAndResultForTheOrganiser() throws Exception {
        Division division = BjjEireCompetitionTestData.division("-76 kg");
        Division empty = BjjEireCompetitionTestData.division("-82 kg");
        BjjEireCompetition competition = publishedWith("admin-results", division, empty);
        String aoife = confirmed(competition, division, "Aoife Byrne", "Team X", "Alliance");
        insertRegistration(competition, division, "Unpaid Byrne", null, null, RegistrationStatus.AWAITING_PAYMENT);
        recordResult(ADMIN_TOKEN, competition.getId(), division.getId(), aoife, null);

        ResponseEntity<String> response = resultsForAdmin(ADMIN_TOKEN, competition.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.size()).isEqualTo(2);
        assertThat(body.at("/0/divisionId").asString()).isEqualTo(division.getId());
        assertThat(body.at("/0/competitors").size()).isEqualTo(1);
        assertThat(body.at("/0/competitors/0/registrationId").asString()).isEqualTo(aoife);
        assertThat(body.at("/0/competitors/0/displayName").asString()).isEqualTo("Aoife Byrne");
        assertThat(body.at("/0/competitors/0/academy").asString()).isEqualTo("Team X");
        assertThat(body.at("/0/result/goldRegistrationId").asString()).isEqualTo(aoife);
        assertThat(body.at("/1/competitors").size()).isZero();
        assertThat(body.at("/1").has("result")).isFalse();
    }
}
