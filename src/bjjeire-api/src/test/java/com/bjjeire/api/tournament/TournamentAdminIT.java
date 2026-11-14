package com.bjjeire.api.tournament;

import static com.bjjeire.api.tournament.TournamentTestData.commandJson;
import static com.bjjeire.api.tournament.TournamentTestData.divisionJson;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditLogEntry;
import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.util.List;
import org.bson.Document;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** The organiser's tournament set-up routes, end to end against MongoDB (User Story 1). */
class TournamentAdminIT extends MongoIntegrationTest {
    // FIXED_NOW is 2026-05-31T00:00:00Z.
    private static final String OPEN_SINCE = "2026-05-01T09:00:00Z";
    private static final String OPENS_LATER = "2026-06-01T09:00:00Z";
    private static final String CLOSES = "2026-06-20T20:00:00Z";
    private static final String CLOSED_ALREADY = "2026-05-30T20:00:00Z";
    private static final String ONE_DIVISION = "[" + divisionJson(null, "-76 kg") + "]";

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5001")
    void shouldStoreANewTournamentAsADraftThatVisitorsCannotSee() throws Exception {
        ResponseEntity<String> created = create(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION));

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode body = objectMapper.readTree(created.getBody());
        assertThat(body.at("/status").asString()).isEqualTo("DRAFT");
        assertThat(body.at("/slug").asString()).isEqualTo("bjjeire");
        assertThat(body.at("/entryFeeCents").asInt()).isEqualTo(2500);
        assertThat(body.at("/currency").asString()).isEqualTo("EUR");
        assertThat(body.at("/placesTaken").asInt()).isZero();
        assertThat(body.at("/divisions/0/id").asString()).matches("^[0-9a-f]{24}$");
        assertThat(created.getHeaders().getLocation())
                .hasToString(ApiRoutes.TOURNAMENT + "/admin/" + body.at("/id").asString());

        assertThat(anonymousGet(ApiRoutes.TOURNAMENT + "/bjjeire").getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(anonymousGet(ApiRoutes.TOURNAMENT).getBody()).doesNotContain("bjjeire");

        Tournament stored = mongoTemplate.findById(body.at("/id").asString(), Tournament.class);
        assertThat(stored.getStatus()).isEqualTo(TournamentStatus.DRAFT);
        assertThat(stored.getCreatedBy()).isEqualTo(AUTHENTICATED_USER);
        assertThat(stored.getCreatedOnUtc()).isEqualTo(FIXED_NOW);
    }

    @Test
    @Tag("#5001")
    void shouldLetTheAdminListAndOpenDrafts() throws Exception {
        String id = createdId(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION));

        ResponseEntity<String> list = adminGet(ApiRoutes.TOURNAMENT + "/admin?page=1&pageSize=20");
        ResponseEntity<String> one = adminGet(ApiRoutes.TOURNAMENT + "/admin/" + id);

        assertThat(list.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(list.getBody()).at("/data/0/status").asString())
                .isEqualTo("DRAFT");
        assertThat(one.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(one.getBody()).at("/divisions").size()).isEqualTo(1);
    }

    @Test
    @Tag("#5002")
    void shouldShowAPublishedTournamentToAVisitorWhoIsNotSignedIn() throws Exception {
        String id = createdId(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION));

        ResponseEntity<String> published = publish(id);

        assertThat(published.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(published.getBody()).at("/status").asString())
                .isEqualTo("PUBLISHED");

        ResponseEntity<String> page = anonymousGet(ApiRoutes.TOURNAMENT + "/bjjeire");
        assertThat(page.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(page.getBody());
        assertThat(body.at("/name").asString()).isEqualTo("BjjEire");
        assertThat(body.at("/description").asString()).isEqualTo("The first in-house tournament.");
        assertThat(body.at("/date").asString()).isEqualTo("2026-06-27");
        assertThat(body.at("/venue/venue").asString()).isEqualTo("National Arena");
        assertThat(body.at("/entryFeeCents").asInt()).isEqualTo(2500);
        assertThat(body.at("/registrationOpensAt").asString()).isEqualTo(OPEN_SINCE);
        assertThat(body.at("/registrationClosesAt").asString()).isEqualTo(CLOSES);
        assertThat(body.at("/divisions/0/weightClass").asString()).isEqualTo("-76 kg");
        assertThat(body.at("/divisions/0/belt").asString()).isEqualTo("WHITE");

        JsonNode list = objectMapper.readTree(anonymousGet(ApiRoutes.TOURNAMENT).getBody());
        assertThat(list.at("/data/0/slug").asString()).isEqualTo("bjjeire");
        assertThat(list.at("/data/0/divisionCount").asInt()).isEqualTo(1);
    }

    @Test
    @Tag("#5003")
    void shouldTellAVisitorWhetherRegistrationIsNotOpenYetOpenOrClosed() throws Exception {
        publish(createdId(commandJson("later", OPENS_LATER, CLOSES, ONE_DIVISION)));
        publish(createdId(commandJson("open", OPEN_SINCE, CLOSES, ONE_DIVISION)));
        publish(createdId(commandJson("closed", OPEN_SINCE, CLOSED_ALREADY, ONE_DIVISION)));

        assertThat(registrationState("later")).isEqualTo("NOT_OPEN");
        assertThat(registrationState("open")).isEqualTo("OPEN");
        assertThat(registrationState("closed")).isEqualTo("CLOSED");
    }

    @Test
    @Tag("#5004")
    void shouldRefuseCreateEditAndPublishToAnyoneWhoIsNotTheOrganiser() throws Exception {
        String id = createdId(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION));
        String edit = commandJson("bjjeire", OPEN_SINCE, CLOSES, "[]");
        String create = commandJson("another", OPEN_SINCE, CLOSES, ONE_DIVISION);

        record Caller(String token, HttpStatus expected) {}
        for (Caller caller : List.of(
                new Caller(null, HttpStatus.UNAUTHORIZED),
                new Caller(COMPETITOR_TOKEN, HttpStatus.FORBIDDEN),
                new Caller(COMPETITOR_TOKEN_WITHOUT_SCOPE, HttpStatus.FORBIDDEN),
                new Caller(READER_TOKEN, HttpStatus.FORBIDDEN))) {
            assertThat(exchange(HttpMethod.POST, ApiRoutes.TOURNAMENT, create, caller.token())
                            .getStatusCode())
                    .as("create with %s", caller.token())
                    .isEqualTo(caller.expected());
            assertThat(exchange(HttpMethod.PUT, ApiRoutes.TOURNAMENT + "/" + id, edit, caller.token())
                            .getStatusCode())
                    .as("edit with %s", caller.token())
                    .isEqualTo(caller.expected());
            assertThat(exchange(HttpMethod.POST, ApiRoutes.TOURNAMENT + "/" + id + "/publish", "", caller.token())
                            .getStatusCode())
                    .as("publish with %s", caller.token())
                    .isEqualTo(caller.expected());
            assertThat(exchange(HttpMethod.GET, ApiRoutes.TOURNAMENT + "/admin/" + id, null, caller.token())
                            .getStatusCode())
                    .as("open draft with %s", caller.token())
                    .isEqualTo(caller.expected());
        }

        Tournament untouched = mongoTemplate.findById(id, Tournament.class);
        assertThat(untouched.getStatus()).isEqualTo(TournamentStatus.DRAFT);
        assertThat(untouched.getDivisions()).hasSize(1);
        assertThat(mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(), Tournament.class))
                .isEqualTo(1);
    }

    @Test
    @Tag("#5005")
    void shouldStopTheOrganiserRemovingADivisionThatHasActiveSignUps() throws Exception {
        JsonNode created = objectMapper.readTree(create(commandJson(
                        "bjjeire",
                        OPEN_SINCE,
                        CLOSES,
                        "[" + divisionJson(null, "-76 kg") + "," + divisionJson(null, "-82 kg") + "]"))
                .getBody());
        String id = created.at("/id").asString();
        String keptDivision = created.at("/divisions/0/id").asString();
        String entered = created.at("/divisions/1/id").asString();
        mongoTemplate.insert(
                new Document("tournamentId", id)
                        .append("divisionId", entered)
                        .append("status", "CONFIRMED")
                        .append("active", true),
                MongoDivisionSignUps.REGISTRATION_COLLECTION);

        ResponseEntity<String> refused = update(
                id, commandJson("bjjeire", OPEN_SINCE, CLOSES, "[" + divisionJson(keptDivision, "-76 kg") + "]"));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        JsonNode problem = objectMapper.readTree(refused.getBody());
        assertThat(problem.at("/type").asString()).isEqualTo("urn:bjjeire:division-has-signups");
        assertThat(problem.at("/detail").asString()).contains("Move or cancel");
        assertThat(mongoTemplate.findById(id, Tournament.class).getDivisions()).hasSize(2);
    }

    @Test
    @Tag("#5005")
    void shouldLetTheOrganiserRemoveADivisionWhoseSignUpsAreNoLongerActive() throws Exception {
        JsonNode created = objectMapper.readTree(create(commandJson(
                        "bjjeire",
                        OPEN_SINCE,
                        CLOSES,
                        "[" + divisionJson(null, "-76 kg") + "," + divisionJson(null, "-82 kg") + "]"))
                .getBody());
        String id = created.at("/id").asString();
        String keptDivision = created.at("/divisions/0/id").asString();
        // A cancelled sign-up has no `active` field (data-model.md).
        mongoTemplate.insert(
                new Document("tournamentId", id)
                        .append("divisionId", created.at("/divisions/1/id").asString())
                        .append("status", "CANCELLED"),
                MongoDivisionSignUps.REGISTRATION_COLLECTION);

        ResponseEntity<String> updated = update(
                id, commandJson("bjjeire", OPEN_SINCE, CLOSES, "[" + divisionJson(keptDivision, "-76 kg") + "]"));

        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(updated.getBody());
        assertThat(body.at("/divisions").size()).isEqualTo(1);
        assertThat(body.at("/divisions/0/id").asString()).isEqualTo(keptDivision);
    }

    @Test
    void shouldKeepDivisionIdsAndGiveNewDivisionsAnIdWhenEditing() throws Exception {
        JsonNode created = objectMapper.readTree(
                create(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION)).getBody());
        String id = created.at("/id").asString();
        String existing = created.at("/divisions/0/id").asString();

        ResponseEntity<String> updated = update(
                id,
                commandJson(
                        "bjjeire-2026",
                        OPEN_SINCE,
                        CLOSES,
                        "[" + divisionJson(existing, "-77 kg") + "," + divisionJson(null, "-82 kg") + "]"));

        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(updated.getBody());
        assertThat(body.at("/slug").asString()).isEqualTo("bjjeire-2026");
        assertThat(body.at("/divisions/0/id").asString()).isEqualTo(existing);
        assertThat(body.at("/divisions/0/weightClass").asString()).isEqualTo("-77 kg");
        assertThat(body.at("/divisions/1/id").asString())
                .matches("^[0-9a-f]{24}$")
                .isNotEqualTo(existing);
        assertThat(mongoTemplate.findById(id, Tournament.class).getUpdatedBy()).isEqualTo(AUTHENTICATED_USER);
    }

    @Test
    void shouldStartAtVersionZeroAndCountEachWrite() throws Exception {
        JsonNode created = objectMapper.readTree(
                create(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION)).getBody());
        String id = created.at("/id").asString();
        String division = "[" + divisionJson(created.at("/divisions/0/id").asString(), "-76 kg") + "]";

        JsonNode updated = objectMapper.readTree(
                update(id, commandJson("bjjeire", OPEN_SINCE, CLOSES, division)).getBody());
        JsonNode published = objectMapper.readTree(publish(id).getBody());

        assertThat(created.at("/version").asLong()).isZero();
        assertThat(updated.at("/version").asLong()).isEqualTo(1);
        assertThat(published.at("/version").asLong()).isEqualTo(2);
    }

    /** Two of the organiser's tabs: the second save must not silently undo the first. */
    @Test
    void shouldRefuseAnUpdateMadeFromAStaleCopy() throws Exception {
        JsonNode created = objectMapper.readTree(create(commandJson(
                        "bjjeire",
                        OPEN_SINCE,
                        CLOSES,
                        "[" + divisionJson(null, "-76 kg") + "," + divisionJson(null, "-82 kg") + "]"))
                .getBody());
        String id = created.at("/id").asString();
        String both = "[" + divisionJson(created.at("/divisions/0/id").asString(), "-76 kg") + ","
                + divisionJson(created.at("/divisions/1/id").asString(), "-82 kg") + "]";
        String onlyFirst = "[" + divisionJson(created.at("/divisions/0/id").asString(), "-76 kg") + "]";
        assertThat(update(id, commandJson("bjjeire", OPEN_SINCE, CLOSES, both), 0)
                        .getStatusCode())
                .isEqualTo(HttpStatus.OK);

        ResponseEntity<String> stale = update(id, commandJson("bjjeire", OPEN_SINCE, CLOSES, onlyFirst), 0);

        assertThat(stale.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(stale.getBody()).contains("urn:bjjeire:conflict", "Reload");
        Tournament stored = mongoTemplate.findById(id, Tournament.class);
        assertThat(stored.getDivisions()).hasSize(2);
        assertThat(stored.getVersion()).isEqualTo(1);
    }

    @Test
    void shouldRefuseADivisionIdTheTournamentDoesNotHave() throws Exception {
        String id = createdId(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION));

        ResponseEntity<String> refused = update(
                id,
                commandJson(
                        "bjjeire", OPEN_SINCE, CLOSES, "[" + divisionJson("0123456789abcdef01234567", "-76 kg") + "]"));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(refused.getBody()).contains("urn:bjjeire:validation-error", "UNKNOWN_DIVISION");
    }

    @Test
    void shouldRefuseTheSameDivisionTwice() {
        ResponseEntity<String> refused = create(commandJson(
                "bjjeire",
                OPEN_SINCE,
                CLOSES,
                "[" + divisionJson(null, "-76 kg") + "," + divisionJson(null, "-76 kg") + "]"));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(refused.getBody()).contains("urn:bjjeire:validation-error", "DUPLICATE_DIVISION");
    }

    @Test
    void shouldRefuseASlugThatIsAlreadyTaken() {
        create(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION));

        ResponseEntity<String> refused = create(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(refused.getBody()).contains("urn:bjjeire:conflict", "slug");
    }

    @Test
    void shouldRefuseToPublishWithoutDivisionsOrWithAnInvalidWindow() throws Exception {
        String noDivisions = createdId(commandJson("empty", OPEN_SINCE, CLOSES, "[]"));
        String backwards = createdId(commandJson("backwards", CLOSES, OPEN_SINCE, ONE_DIVISION));

        assertThat(publish(noDivisions).getBody()).contains("urn:bjjeire:no-divisions");
        assertThat(publish(noDivisions).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(publish(backwards).getBody()).contains("urn:bjjeire:invalid-window");
        assertThat(anonymousGet(ApiRoutes.TOURNAMENT + "/empty").getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void shouldRefuseToPublishTwiceAndToEmptyAPublishedTournament() throws Exception {
        String id = createdId(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION));
        publish(id);

        assertThat(publish(id).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        ResponseEntity<String> emptied = update(id, commandJson("bjjeire", OPEN_SINCE, CLOSES, "[]"));
        assertThat(emptied.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(emptied.getBody()).contains("urn:bjjeire:no-divisions");
    }

    @Test
    void shouldShowAnEditToVisitorsOnTheNextRead() throws Exception {
        String id = createdId(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION));
        publish(id);
        anonymousGet(ApiRoutes.TOURNAMENT + "/bjjeire");
        anonymousGet(ApiRoutes.TOURNAMENT);
        String existing = mongoTemplate
                .findById(id, Tournament.class)
                .getDivisions()
                .get(0)
                .getId();

        update(
                id,
                commandJson("bjjeire", OPEN_SINCE, CLOSES, "[" + divisionJson(existing, "-76 kg") + "]")
                        .replace("\"entryFeeCents\": 2500", "\"entryFeeCents\": 3000"));

        assertThat(objectMapper
                        .readTree(
                                anonymousGet(ApiRoutes.TOURNAMENT + "/bjjeire").getBody())
                        .at("/entryFeeCents")
                        .asInt())
                .isEqualTo(3000);
        assertThat(objectMapper
                        .readTree(anonymousGet(ApiRoutes.TOURNAMENT).getBody())
                        .at("/data/0/entryFeeCents")
                        .asInt())
                .isEqualTo(3000);
    }

    @Test
    void shouldNotLoseTakenPlacesWhenTheOrganiserEdits() throws Exception {
        JsonNode created = objectMapper.readTree(
                create(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION)).getBody());
        String id = created.at("/id").asString();
        mongoTemplate.updateFirst(
                org.springframework.data.mongodb.core.query.Query.query(
                        org.springframework.data.mongodb.core.query.Criteria.where("_id")
                                .is(id)),
                new org.springframework.data.mongodb.core.query.Update().inc("placesTaken", 3),
                Tournament.class);

        ResponseEntity<String> updated = update(
                id,
                commandJson(
                        "bjjeire",
                        OPEN_SINCE,
                        CLOSES,
                        "[" + divisionJson(created.at("/divisions/0/id").asString(), "-76 kg") + "]"));

        assertThat(objectMapper.readTree(updated.getBody()).at("/placesTaken").asInt())
                .isEqualTo(3);
    }

    @Test
    void shouldRecordEachOrganiserWriteInTheAuditLog() throws Exception {
        String id = createdId(commandJson("bjjeire", OPEN_SINCE, CLOSES, ONE_DIVISION));
        publish(id);

        List<AuditLogEntry> entries = mongoTemplate.findAll(AuditLogEntry.class);
        assertThat(entries)
                .extracting(AuditLogEntry::getAction)
                .containsExactlyInAnyOrder(AuditAction.Create, AuditAction.Publish);
        assertThat(entries).allSatisfy(entry -> {
            assertThat(entry.getEntityType()).isEqualTo(Tournament.ENTITY_NAME);
            assertThat(entry.getEntityId()).isEqualTo(id);
            assertThat(entry.getActor()).isEqualTo(AUTHENTICATED_USER);
        });
    }

    private String registrationState(String slug) throws Exception {
        return objectMapper
                .readTree(anonymousGet(ApiRoutes.TOURNAMENT + "/" + slug).getBody())
                .at("/registrationState")
                .asString();
    }

    private String createdId(String command) throws Exception {
        ResponseEntity<String> created = create(command);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return objectMapper.readTree(created.getBody()).at("/id").asString();
    }

    private ResponseEntity<String> create(String command) {
        return restTemplate.postForEntity(ApiRoutes.TOURNAMENT, jsonEntity(command), String.class);
    }

    /** Sends the update from the stored version, as a client editing the latest copy would. */
    private ResponseEntity<String> update(String id, String command) {
        return update(id, command, mongoTemplate.findById(id, Tournament.class).getVersion());
    }

    private ResponseEntity<String> update(String id, String command, long version) {
        return restTemplate.exchange(
                ApiRoutes.TOURNAMENT + "/" + id,
                HttpMethod.PUT,
                jsonEntity(command.replaceFirst("\\{", "{ \"version\": " + version + ",")),
                String.class);
    }

    private ResponseEntity<String> publish(String id) {
        return restTemplate.postForEntity(ApiRoutes.TOURNAMENT + "/" + id + "/publish", jsonEntity(""), String.class);
    }

    private ResponseEntity<String> adminGet(String path) {
        return restTemplate.exchange(path, HttpMethod.GET, jsonEntity(null), String.class);
    }

    private ResponseEntity<String> anonymousGet(String path) {
        return restTemplate.getForEntity(path, String.class);
    }

    private ResponseEntity<String> exchange(HttpMethod method, String path, String body, String token) {
        return restTemplate.exchange(path, method, jsonEntity(body, token), String.class);
    }
}
