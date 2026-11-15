package com.bjjeire.api.competitor;

import static com.bjjeire.api.competitor.CompetitorTestData.minimalProfileJson;
import static com.bjjeire.api.competitor.CompetitorTestData.profileJson;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditLogEntry;
import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.gym.GymStatus;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** The signed-in competitor's own profile, end to end against MongoDB (User Story 2). */
class CompetitorIT extends MongoIntegrationTest {
    private static final String ME = ApiRoutes.COMPETITOR + "/me";

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5007")
    void shouldShowAnEmptyUnsavedProfileBeforeTheFirstSave() throws Exception {
        ResponseEntity<String> response = get(COMPETITOR_TOKEN);

        // Owner's decision 2026-11-15: no 404 on a first visit. The email from the sign-in is already known.
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/saved").asBoolean()).isFalse();
        assertThat(body.at("/profileComplete").asBoolean()).isFalse();
        assertThat(body.at("/email").asString()).isEqualTo(competitorEmail(COMPETITOR_SUBJECT));
        assertThat(absent(body.at("/firstName"))).isTrue();
        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isZero();
    }

    @Test
    @Tag("#5007")
    void shouldShowASavedProfileBackToTheCompetitor() throws Exception {
        ResponseEntity<String> saved = put(profileJson("Aoife"), COMPETITOR_TOKEN);

        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(get(COMPETITOR_TOKEN).getBody());
        assertThat(body.at("/firstName").asString()).isEqualTo("Aoife");
        assertThat(body.at("/middleName").asString()).isEqualTo("Máire");
        assertThat(body.at("/lastName").asString()).isEqualTo("Byrne");
        assertThat(body.at("/nationality").asString()).isEqualTo("IE");
        assertThat(body.at("/dateOfBirth").asString()).isEqualTo("1990-04-12");
        assertThat(body.at("/gender").asString()).isEqualTo("FEMALE");
        assertThat(body.at("/belt").asString()).isEqualTo("BLUE");
        assertThat(body.at("/academy/name").asString()).isEqualTo("Team X");
        assertThat(body.at("/affiliation").asString()).isEqualTo("Alliance");
        assertThat(body.at("/phone").asString()).isEqualTo("+353 87 123 4567");
        assertThat(body.at("/address/city").asString()).isEqualTo("Dublin");
        assertThat(body.at("/profileComplete").asBoolean()).isTrue();
        assertThat(body.at("/saved").asBoolean()).isTrue();
        // The email comes from the token, never from the body.
        assertThat(body.at("/email").asString()).isEqualTo(competitorEmail(COMPETITOR_SUBJECT));
        assertThat(body.has("id")).isFalse();
        assertThat(body.has("subject")).isFalse();
        assertThat(body.has("issuer")).isFalse();
    }

    @Test
    @Tag("#5007")
    void shouldKeepTheProfileKeyedByIssuerAndSubjectAndAuditEachSave() {
        put(profileJson("Aoife"), COMPETITOR_TOKEN);
        put(profileJson("Aoibhinn"), COMPETITOR_TOKEN);

        List<Competitor> stored = mongoTemplate.findAll(Competitor.class);
        assertThat(stored).singleElement().satisfies(competitor -> {
            assertThat(competitor.getIssuer()).isEqualTo(COMPETITOR_ISSUER);
            assertThat(competitor.getSubject()).isEqualTo(COMPETITOR_SUBJECT);
            assertThat(competitor.getFirstName()).isEqualTo("Aoibhinn");
            assertThat(competitor.getCreatedOnUtc()).isEqualTo(FIXED_NOW);
            assertThat(competitor.getCreatedBy()).isEqualTo(COMPETITOR_SUBJECT);
            assertThat(competitor.getUpdatedOnUtc()).isEqualTo(FIXED_NOW);
        });
        assertThat(mongoTemplate.findAll(AuditLogEntry.class))
                .extracting(AuditLogEntry::getAction)
                .containsExactly(AuditAction.Create, AuditAction.Update);
        assertThat(mongoTemplate.findAll(AuditLogEntry.class))
                .allSatisfy(entry -> assertThat(entry.getEntityType()).isEqualTo(Competitor.ENTITY_NAME));
    }

    @Test
    @Tag("#5007")
    void shouldReportAnIncompleteProfileThatCannotSignUpYet() throws Exception {
        ResponseEntity<String> saved = put(minimalProfileJson(), COMPETITOR_TOKEN);

        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(saved.getBody()).at("/profileComplete").asBoolean())
                .isFalse();
    }

    @Test
    @Tag("#5010")
    void shouldNeverCreateTwoProfilesForOneIdentity() throws Exception {
        try (ExecutorService pool = Executors.newFixedThreadPool(4)) {
            List<CompletableFuture<ResponseEntity<String>>> saves = java.util.stream.IntStream.range(0, 8)
                    .mapToObj(i ->
                            CompletableFuture.supplyAsync(() -> put(profileJson("Aoife" + i), COMPETITOR_TOKEN), pool))
                    .toList();
            for (CompletableFuture<ResponseEntity<String>> save : saves) {
                assertThat(save.get().getStatusCode()).isEqualTo(HttpStatus.OK);
            }
        }

        long profiles = mongoTemplate.count(
                Query.query(Criteria.where("issuer")
                        .is(COMPETITOR_ISSUER)
                        .and("subject")
                        .is(COMPETITOR_SUBJECT)),
                Competitor.class);
        assertThat(profiles).isEqualTo(1);
    }

    @Test
    @Tag("#5008")
    void shouldTakeTheAcademyNameFromTheDirectoryGym() throws Exception {
        Gym gym = mongoTemplate.insert(
                Gym.builder().name("Directory Gym").status(GymStatus.Active).build());

        ResponseEntity<String> saved = put(
                profileJson("Aoife", "{ \"gymId\": \"%s\", \"name\": \"typed over\" }".formatted(gym.getId()), "null"),
                COMPETITOR_TOKEN);

        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(saved.getBody());
        assertThat(body.at("/academy/gymId").asString()).isEqualTo(gym.getId());
        assertThat(body.at("/academy/name").asString()).isEqualTo("Directory Gym");
        assertThat(absent(body.at("/affiliation"))).isTrue();
    }

    @Test
    @Tag("#5008")
    void shouldRefuseAGymThatIsNotInTheDirectory() throws Exception {
        ResponseEntity<String> saved =
                put(profileJson("Aoife", "{ \"gymId\": \"665624c1ad01ce465c6cf456\" }", "null"), COMPETITOR_TOKEN);

        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(objectMapper
                        .readTree(saved.getBody())
                        .at("/errors/0/errorCode")
                        .asString())
                .isEqualTo("UNKNOWN_GYM");
        assertThat(mongoTemplate.count(new Query(), Competitor.class)).isZero();
    }

    /** A gym visitors cannot see (draft, rejected, closed) is not in the directory for this purpose either. */
    @Test
    @Tag("#5008")
    void shouldRefuseAGymThatIsNotPublicInTheDirectory() throws Exception {
        Gym draft = mongoTemplate.insert(
                Gym.builder().name("Hidden Draft Gym").status(GymStatus.Draft).build());

        ResponseEntity<String> saved =
                put(profileJson("Aoife", "{ \"gymId\": \"%s\" }".formatted(draft.getId()), "null"), COMPETITOR_TOKEN);

        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(saved.getBody()).doesNotContain("Hidden Draft Gym");
    }

    /** A gym removed from the directory after it was chosen must not stop the competitor saving other changes. */
    @Test
    @Tag("#5008")
    void shouldKeepAChosenGymThatHasSinceLeftTheDirectory() throws Exception {
        Gym gym = mongoTemplate.insert(
                Gym.builder().name("Closing Gym").status(GymStatus.Active).build());
        String academy = "{ \"gymId\": \"%s\" }".formatted(gym.getId());
        put(profileJson("Aoife", academy, "null"), COMPETITOR_TOKEN);
        mongoTemplate.remove(gym);

        ResponseEntity<String> resaved = put(profileJson("Aoibhinn", academy, "null"), COMPETITOR_TOKEN);

        assertThat(resaved.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(resaved.getBody());
        assertThat(body.at("/firstName").asString()).isEqualTo("Aoibhinn");
        assertThat(body.at("/academy/name").asString()).isEqualTo("Closing Gym");
    }

    @Test
    @Tag("#5008")
    void shouldAcceptATypedAcademyNameOrNoAcademyAndAnOptionalAffiliation() throws Exception {
        JsonNode typed = objectMapper.readTree(
                put(profileJson("Aoife", "{ \"name\": \"  My Garage  \" }", "\"  \""), COMPETITOR_TOKEN)
                        .getBody());
        assertThat(typed.at("/academy/name").asString()).isEqualTo("My Garage");
        assertThat(absent(typed.at("/academy/gymId"))).isTrue();
        assertThat(absent(typed.at("/affiliation"))).isTrue();

        JsonNode none = objectMapper.readTree(put(profileJson("Aoife", "null", "\"Alliance\""), COMPETITOR_TOKEN)
                .getBody());
        assertThat(absent(none.at("/academy"))).isTrue();
        assertThat(none.at("/affiliation").asString()).isEqualTo("Alliance");
    }

    @Test
    void shouldAnswerValidationErrorsInTheUsualProblemShape() throws Exception {
        ResponseEntity<String> saved = put("{ \"firstName\": \"\", \"nationality\": \"XX\" }", COMPETITOR_TOKEN);

        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        JsonNode body = objectMapper.readTree(saved.getBody());
        assertThat(body.at("/type").asString()).isEqualTo("urn:bjjeire:validation-error");
        assertThat(body.at("/errors").findValuesAsString("field"))
                .contains("FirstName", "LastName", "DateOfBirth", "Nationality");
    }

    /** The API leaves null fields out of the body. */
    private static boolean absent(JsonNode node) {
        return node.isMissingNode() || node.isNull();
    }

    private ResponseEntity<String> get(String token) {
        return restTemplate.exchange(ME, HttpMethod.GET, jsonEntity(null, token), String.class);
    }

    private ResponseEntity<String> put(String body, String token) {
        return restTemplate.exchange(ME, HttpMethod.PUT, jsonEntity(body, token), String.class);
    }
}
