package com.bjjeire.api.competitor;

import static com.bjjeire.api.competitor.CompetitorTestData.profileJson;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditLogEntry;
import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import org.bson.Document;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Deleting an account removes the profile and the sign-in identity (#5012, research R11), and medal history (#5039).
 */
class CompetitorDeletionIT extends MongoIntegrationTest {
    private static final String ME = ApiRoutes.COMPETITOR + "/me";
    private static final String AOIFE = competitorToken("aoife");

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5012")
    void shouldRemoveThePersonalDetailsAndTheSignInIdentity() {
        put(profileJson("Aoife"), AOIFE);

        ResponseEntity<String> deleted = exchange(HttpMethod.DELETE, AOIFE);

        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isZero();
        assertThat(identityDirectory.deleted()).containsExactly(competitorObjectId("aoife"));
        assertThat(mongoTemplate.findAll(AuditLogEntry.class))
                .extracting(AuditLogEntry::getAction)
                .containsExactly(AuditAction.Create, AuditAction.Delete);
    }

    @Test
    @Tag("#5012")
    void shouldRefuseTheDeletedIdentityFromThenOn() throws Exception {
        put(profileJson("Aoife"), AOIFE);
        exchange(HttpMethod.DELETE, AOIFE);

        // Even while the directory still holds the identity (Graph unreachable, or not configured), the API refuses
        // its tokens on every competitor route. The person can no longer sign in to this site.
        for (HttpMethod method : new HttpMethod[] {HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE}) {
            ResponseEntity<String> after =
                    restTemplate.exchange(ME, method, jsonEntity(profileJson("Aoife"), AOIFE), String.class);
            assertThat(after.getStatusCode()).as(method.name()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }
        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isZero();
        assertThat(identityDirectory.deleted()).hasSize(1);
        // Another competitor is unaffected.
        assertThat(exchange(HttpMethod.GET, competitorToken("brian")).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    @Tag("#5012")
    void shouldStillDeleteTheAccountWhenTheDirectoryCannotBeReached() {
        put(profileJson("Aoife"), AOIFE);
        identityDirectory.failFromNowOn();

        ResponseEntity<String> deleted = exchange(HttpMethod.DELETE, AOIFE);

        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isZero();
        assertThat(exchange(HttpMethod.GET, AOIFE).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @Tag("#5012")
    void shouldDeleteTheIdentityOfSomeoneWhoNeverSavedAProfile() {
        ResponseEntity<String> deleted = exchange(HttpMethod.DELETE, AOIFE);

        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(identityDirectory.deleted()).containsExactly(competitorObjectId("aoife"));
        assertThat(exchange(HttpMethod.GET, AOIFE).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    /**
     * The owner's defect report (2026-11-15): someone who deleted their account must be able to sign up again with the
     * same email. The deletion ends the sessions that existed then; a later sign-in starts a new, empty account. This
     * is what happens whenever the new sign-in carries the same identity: always locally (the email is the identity),
     * and in production while the tenant still holds the user (Graph not configured or unreachable).
     */
    @Test
    @Tag("#5012")
    void shouldLetThePersonSignUpAgainWithTheSameEmailAfterDeleting() throws Exception {
        String before = competitorToken("aoife", FIXED_NOW.minusSeconds(60));
        put(profileJson("Aoife"), before);
        exchange(HttpMethod.DELETE, before);

        String after = competitorToken("aoife", FIXED_NOW.plusSeconds(1));

        assertThat(exchange(HttpMethod.GET, before).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        // A new, empty account: nothing of the deleted one comes back.
        JsonNode fresh = objectMapper.readTree(exchange(HttpMethod.GET, after).getBody());
        assertThat(fresh.at("/saved").asBoolean()).isFalse();
        assertThat(fresh.at("/firstName").isMissingNode()).isTrue();
        put(profileJson("Aoibhinn"), after);
        JsonNode body = objectMapper.readTree(exchange(HttpMethod.GET, after).getBody());
        assertThat(body.at("/firstName").asString()).isEqualTo("Aoibhinn");
        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isOne();
    }

    /** The new account can be deleted in its turn: the record moves forward to the later deletion. */
    @Test
    @Tag("#5012")
    void shouldDeleteTheNewAccountTooWhenThePersonDeletesAgain() {
        // Timeline (the clock is fixed at FIXED_NOW): first deletion at -90 s, second sign-in at -60 s, second
        // deletion at FIXED_NOW.
        exchange(HttpMethod.DELETE, competitorToken("aoife", FIXED_NOW.minusSeconds(120)));
        mongoTemplate.updateFirst(
                new Query(),
                org.springframework.data.mongodb.core.query.Update.update("deletedAt", FIXED_NOW.minusSeconds(90)),
                DeletedCompetitor.class);
        String second = competitorToken("aoife", FIXED_NOW.minusSeconds(60));
        put(profileJson("Aoibhinn"), second);

        assertThat(exchange(HttpMethod.DELETE, second).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isZero();
        assertThat(mongoTemplate.findAll(DeletedCompetitor.class))
                .singleElement()
                .extracting(DeletedCompetitor::getDeletedAt)
                .isEqualTo(FIXED_NOW);
        assertThat(exchange(HttpMethod.GET, second).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    /** Spec edge case: a competitor with an unpaid or confirmed sign-up is told to cancel it first. */
    @Test
    @Tag("#5012")
    void shouldRefuseWhileTheCompetitorHasAnActiveSignUp() throws Exception {
        put(profileJson("Aoife"), AOIFE);
        String competitorId = mongoTemplate.findAll(Competitor.class).getFirst().getId();
        // The sign-up slice owns this collection; written by its documented fields (data-model.md).
        mongoTemplate.insert(
                new Document("competitionId", "665624c1ad01ce465c6cf456")
                        .append("divisionId", "665624c1ad01ce465c6cf457")
                        .append("competitorId", competitorId)
                        .append("status", "CONFIRMED")
                        .append("active", true),
                "BjjEireCompetitionRegistration");

        ResponseEntity<String> refused = exchange(HttpMethod.DELETE, AOIFE);

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(objectMapper.readTree(refused.getBody()).at("/type").asString())
                .isEqualTo("urn:bjjeire:has-active-registration");
        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isOne();
        assertThat(identityDirectory.deleted()).isEmpty();
        assertThat(exchange(HttpMethod.GET, AOIFE).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    /**
     * Spec edge case: a medallist deletes their account after the competition finished. Their confirmed sign-up stays
     * active for ever and cannot be cancelled once a result names it (FR-026), so it must not block the deletion; the
     * medal and its points stay under the placeholder name (FR-013).
     */
    @Test
    @Tag("#5012")
    void shouldDeleteAMedallistOnceTheirCompetitionHasFinishedAndKeepTheMedal() throws Exception {
        put(profileJson("Aoife"), AOIFE);
        String competitorId = mongoTemplate.findAll(Competitor.class).getFirst().getId();
        String competitionId = "665624c1ad01ce465c6cf460";
        String divisionId = "665624c1ad01ce465c6cf461";
        String gold = "665624c1ad01ce465c6cf462";
        String silver = "665624c1ad01ce465c6cf463";
        mongoTemplate.insert(com.bjjeire.api.bjjeirecompetition.BjjEireCompetition.builder()
                .id(competitionId)
                .slug("finished-medal")
                .name("Finished")
                .date(java.time.LocalDate.parse("2026-05-02"))
                .status(com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus.FINISHED)
                .version(0L)
                .divisions(java.util.List.of(com.bjjeire.api.bjjeirecompetition.Division.builder()
                        .id(divisionId)
                        .result(com.bjjeire.api.bjjeirecompetition.DivisionResult.builder()
                                .goldRegistrationId(gold)
                                .silverRegistrationId(silver)
                                .confirmedCompetitors(2)
                                .build())
                        .build()))
                .build());
        for (String[] signUp :
                new String[][] {{gold, competitorId, "Aoife Byrne"}, {silver, "someone-else", "Ciaran"}}) {
            mongoTemplate.insert(
                    new Document("_id", new org.bson.types.ObjectId(signUp[0]))
                            .append("competitionId", competitionId)
                            .append("divisionId", divisionId)
                            .append("competitorId", signUp[1])
                            .append("status", "CONFIRMED")
                            .append("active", true)
                            .append("displayName", signUp[2])
                            .append("academy", new Document("name", "Team X"))
                            .append("academyKey", "name:team x"),
                    "BjjEireCompetitionRegistration");
        }

        ResponseEntity<String> deleted = exchange(HttpMethod.DELETE, AOIFE);

        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isZero();
        JsonNode board = objectMapper.readTree(restTemplate
                .exchange(
                        com.bjjeire.api.common.ApiRoutes.BJJEIRE_COMPETITION + "/" + competitionId + "/leaderboard",
                        HttpMethod.GET,
                        jsonEntity(null, null),
                        String.class)
                .getBody());
        assertThat(board.at("/podiums/0/gold/displayName").asString())
                .isEqualTo(com.bjjeire.api.registration.BjjEireCompetitionRegistration.DELETED_DISPLAY_NAME);
        assertThat(board.at("/academyRanking/0/points").asInt()).isEqualTo(12);
    }

    /**
     * Two medallists of one finished division delete their accounts. Anonymising unsets each sign-up's competitor link;
     * it must also end {@code active}, or the second deletion collides with the first on the one-active-sign-up index.
     */
    @Test
    @Tag("#5012")
    void shouldDeleteTwoMedallistsOfTheSameFinishedDivision() {
        String competitionId = "665624c1ad01ce465c6cf480";
        String divisionId = "665624c1ad01ce465c6cf481";
        mongoTemplate.insert(com.bjjeire.api.bjjeirecompetition.BjjEireCompetition.builder()
                .id(competitionId)
                .slug("finished-two")
                .name("Finished")
                .date(java.time.LocalDate.parse("2026-05-02"))
                .status(com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus.FINISHED)
                .version(0L)
                .build());
        String ciaran = competitorToken("ciaran-two");
        for (String token : new String[] {AOIFE, ciaran}) {
            put(profileJson("Someone"), token);
        }
        for (Competitor competitor : mongoTemplate.findAll(Competitor.class)) {
            mongoTemplate.insert(
                    new Document("competitionId", competitionId)
                            .append("divisionId", divisionId)
                            .append("competitorId", competitor.getId())
                            .append("status", "CONFIRMED")
                            .append("active", true)
                            .append("displayName", "Someone Byrne"),
                    "BjjEireCompetitionRegistration");
        }

        assertThat(exchange(HttpMethod.DELETE, AOIFE).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(exchange(HttpMethod.DELETE, ciaran).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isZero();
        assertThat(mongoTemplate.findAll(Document.class, "BjjEireCompetitionRegistration"))
                .hasSize(2)
                .allSatisfy(signUp -> {
                    assertThat(signUp.get("status")).isEqualTo("CONFIRMED");
                    assertThat(signUp).doesNotContainKeys("competitorId", "active");
                });
    }

    /** A sign-up in a competition that is still published blocks the deletion, as before. */
    @Test
    @Tag("#5012")
    void shouldStillRefuseWhileTheCompetitionOfAConfirmedSignUpIsPublished() {
        put(profileJson("Aoife"), AOIFE);
        String competitorId = mongoTemplate.findAll(Competitor.class).getFirst().getId();
        String competitionId = "665624c1ad01ce465c6cf470";
        mongoTemplate.insert(com.bjjeire.api.bjjeirecompetition.BjjEireCompetition.builder()
                .id(competitionId)
                .slug("published-still")
                .name("Published")
                .date(java.time.LocalDate.parse("2026-06-27"))
                .status(com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus.PUBLISHED)
                .version(0L)
                .build());
        mongoTemplate.insert(
                new Document("competitionId", competitionId)
                        .append("divisionId", "665624c1ad01ce465c6cf471")
                        .append("competitorId", competitorId)
                        .append("status", "CONFIRMED")
                        .append("active", true),
                "BjjEireCompetitionRegistration");

        assertThat(exchange(HttpMethod.DELETE, AOIFE).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isOne();
    }

    /** The sign-up slice may store the link as an ObjectId; the guard must not fail open then. */
    @Test
    @Tag("#5012")
    void shouldRefuseWhenTheActiveSignUpStoresTheCompetitorAsAnObjectId() {
        put(profileJson("Aoife"), AOIFE);
        String competitorId = mongoTemplate.findAll(Competitor.class).getFirst().getId();
        mongoTemplate.insert(
                new Document("competitorId", new org.bson.types.ObjectId(competitorId)).append("active", true),
                "BjjEireCompetitionRegistration");

        assertThat(exchange(HttpMethod.DELETE, AOIFE).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isOne();
    }

    @Test
    @Tag("#5012")
    void shouldAllowDeletionWhenEverySignUpHasEnded() {
        put(profileJson("Aoife"), AOIFE);
        String competitorId = mongoTemplate.findAll(Competitor.class).getFirst().getId();
        mongoTemplate.insert(
                new Document("competitionId", "665624c1ad01ce465c6cf456")
                        .append("divisionId", "665624c1ad01ce465c6cf457")
                        .append("competitorId", competitorId)
                        .append("status", "CANCELLED"),
                "BjjEireCompetitionRegistration");

        assertThat(exchange(HttpMethod.DELETE, AOIFE).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @Tag("#5039")
    void shouldShowEmptyMedalHistoryUntilResultsAreRecorded() throws Exception {
        put(profileJson("Aoife"), AOIFE);

        ResponseEntity<String> history = exchange(HttpMethod.GET, ME + "/history", AOIFE);

        assertThat(history.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(history.getBody());
        assertThat(body.at("/gold").asInt()).isZero();
        assertThat(body.at("/silver").asInt()).isZero();
        assertThat(body.at("/bronze").asInt()).isZero();
        assertThat(body.at("/competitions").isArray()).isTrue();
        assertThat(body.at("/competitions").size()).isZero();
    }

    private void put(String body, String token) {
        assertThat(restTemplate
                        .exchange(ME, HttpMethod.PUT, jsonEntity(body, token), String.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    private ResponseEntity<String> exchange(HttpMethod method, String token) {
        return exchange(method, ME, token);
    }

    private ResponseEntity<String> exchange(HttpMethod method, String path, String token) {
        return restTemplate.exchange(path, method, jsonEntity(null, token), String.class);
    }
}
