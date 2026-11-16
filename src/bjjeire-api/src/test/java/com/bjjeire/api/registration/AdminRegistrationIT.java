package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.tournament.AgeCategory;
import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Discipline;
import com.bjjeire.api.tournament.Division;
import com.bjjeire.api.tournament.Gender;
import com.bjjeire.api.tournament.Tournament;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** The organiser's sign-up tools (FR-006, FR-007). */
class AdminRegistrationIT extends RegistrationIntegrationTest {
    private static final String ADMIN = "integration-test-token";
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");

    private static final Set<String> ROW_FIELDS = Set.of(
            "registrationId",
            "displayName",
            "email",
            "phone",
            "dateOfBirth",
            "gender",
            "belt",
            "academy",
            "affiliation",
            "academyKey",
            "affiliationKey",
            "division",
            "status",
            "amountCents",
            "paymentStatus",
            "refundStatus",
            "paymentUnconfirmed",
            "profileMismatch",
            "createdAt");

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldListEverySignUpWithExactlyTheAdminFields() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("admin-list", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        confirmedSignUp(AOIFE, tournament, division);
        signUp(CIARAN, tournament.getId(), division.getId());

        ResponseEntity<String> response = get(tournament.getId(), "?page=1&pageSize=20", ADMIN);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(2);
        JsonNode rows = body.at("/data");
        assertThat(rows.size()).isEqualTo(2);
        // Null values are left out of the JSON; nothing outside the contract's fields is ever sent.
        for (JsonNode row : rows) {
            assertThat(ROW_FIELDS).containsAll(fieldNames(row));
        }
        JsonNode aoife = rowFor(rows, "Aoife Byrne");
        assertThat(aoife.at("/email").asString()).isEqualTo(competitorEmail("aoife"));
        assertThat(aoife.at("/phone").asString()).isEqualTo("+353 87 123 4567");
        assertThat(aoife.at("/dateOfBirth").asString()).isEqualTo(ADULT_BIRTH_DATE);
        assertThat(aoife.at("/gender").asString()).isEqualTo("MALE");
        assertThat(aoife.at("/belt").asString()).isEqualTo("WHITE");
        assertThat(aoife.at("/academy").asString()).isEqualTo("Team X");
        assertThat(aoife.at("/affiliation").asString()).isEqualTo("Alliance");
        assertThat(aoife.at("/academyKey").asString()).isEqualTo("name:team x");
        assertThat(aoife.at("/affiliationKey").asString()).isEqualTo("alliance");
        assertThat(aoife.at("/division/id").asString()).isEqualTo(division.getId());
        assertThat(aoife.at("/status").asString()).isEqualTo("CONFIRMED");
        assertThat(aoife.at("/amountCents").asInt()).isEqualTo(2500);
        assertThat(aoife.at("/paymentStatus").asString()).isEqualTo("PAID");
        assertThat(fieldNames(aoife))
                .containsExactlyInAnyOrderElementsOf(ROW_FIELDS.stream()
                        .filter(field -> !"refundStatus".equals(field))
                        .toList());
        assertThat(aoife.at("/paymentUnconfirmed").asBoolean()).isFalse();
        assertThat(aoife.at("/profileMismatch").asBoolean()).isFalse();
        assertThat(rowFor(rows, "Ciaran Byrne").at("/status").asString()).isEqualTo("AWAITING_PAYMENT");
    }

    @Test
    void shouldFlagAPaymentStripeTookThatNoWebhookConfirmed() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("admin-unconfirmed", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, tournament.getId(), division.getId());
        mongoTemplate.updateFirst(
                new Query(), Update.update("payment.unconfirmedAlertedAt", FIXED_NOW), TournamentRegistration.class);

        JsonNode rows = objectMapper
                .readTree(get(tournament.getId(), "", ADMIN).getBody())
                .at("/data");

        assertThat(rows.at("/0/paymentUnconfirmed").asBoolean()).isTrue();
    }

    @Test
    void shouldExportEveryRowAsCsvWithTheSameColumns() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("admin-csv", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(
                CIARAN,
                "Ciaran",
                Gender.MALE,
                Belt.WHITE,
                ADULT_BIRTH_DATE,
                "{ \"name\": \"Team, \\\"Quoted\\\"\" }",
                "null");
        confirmedSignUp(AOIFE, tournament, division);
        confirmedSignUp(CIARAN, tournament, division);

        ResponseEntity<String> response = get(tournament.getId(), "?format=csv&pageSize=1", ADMIN);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType().isCompatibleWith(MediaType.parseMediaType("text/csv")))
                .isTrue();
        assertThat(response.getHeaders().getContentDisposition().getFilename()).endsWith(".csv");
        String[] lines = response.getBody().split("\r\n");
        assertThat(lines[0])
                .isEqualTo("registrationId,displayName,email,phone,dateOfBirth,gender,belt,academy,affiliation,"
                        + "academyKey,affiliationKey,division,status,amountCents,paymentStatus,refundStatus,paymentUnconfirmed,"
                        + "profileMismatch,createdAt");
        // pageSize does not apply: the export holds every row.
        assertThat(lines).hasSize(3);
        assertThat(response.getBody()).contains("\"Team, \"\"Quoted\"\"\"");
        assertThat(response.getBody()).contains("Gi, Male, Adult, White belt, -76 kg");
    }

    @Test
    void shouldNotLetASpreadsheetRunAFormulaFromACompetitorsName() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("admin-csv-formula", null, division);
        saveProfile(AOIFE, "=SUM(1)", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        confirmedSignUp(AOIFE, tournament, division);

        String csv = get(tournament.getId(), "?format=csv", ADMIN).getBody();

        assertThat(csv).doesNotContain(",=SUM(1)").contains("'=SUM(1) Byrne");
    }

    @Test
    void shouldLetTheOrganiserMoveASignUpAfterRegistrationHasClosedWithoutAnEligibilityCheck() {
        Division white = maleWhiteAdult("-76 kg");
        Division blue = division(Discipline.GI, Gender.MALE, AgeCategory.ADULT, Belt.BLUE, "-76 kg");
        Tournament tournament = publishedTournament("admin-move", null, white, blue);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        TournamentRegistration confirmed = confirmedSignUp(AOIFE, tournament, white);
        closeRegistration(tournament.getId());

        ResponseEntity<String> response = restTemplate.exchange(
                ApiRoutes.TOURNAMENT + "/" + tournament.getId() + "/registration/" + confirmed.getId() + "/division",
                HttpMethod.PUT,
                jsonEntity("{ \"divisionId\": \"" + blue.getId() + "\" }", ADMIN),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode row = objectMapper.readTree(response.getBody());
        assertThat(row.at("/division/id").asString()).isEqualTo(blue.getId());
        // A white belt in a blue-belt division: the organiser sees the mismatch.
        assertThat(row.at("/profileMismatch").asBoolean()).isTrue();
        assertThat(reload(confirmed).getDivisionId()).isEqualTo(blue.getId());
        assertThat(placesTaken(tournament.getId())).isEqualTo(1);
        assertThat(paymentGateway.refunds()).isEmpty();
    }

    @Test
    void shouldCancelWithOrWithoutARefundAsTheOrganiserChooses() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("admin-cancel", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        TournamentRegistration refunded = confirmedSignUp(AOIFE, tournament, division);
        TournamentRegistration kept = confirmedSignUp(CIARAN, tournament, division);
        // After the window: a competitor would get nothing back, the organiser may still refund.
        closeRegistration(tournament.getId());

        ResponseEntity<String> withRefund = adminCancel(tournament.getId(), refunded.getId(), true);
        ResponseEntity<String> withoutRefund = adminCancel(tournament.getId(), kept.getId(), false);

        assertThat(withRefund.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(withRefund.getBody()).at("/refunded").asBoolean())
                .isTrue();
        assertThat(objectMapper
                        .readTree(withoutRefund.getBody())
                        .at("/refunded")
                        .asBoolean())
                .isFalse();
        assertThat(paymentGateway.refunds()).hasSize(1);
        assertThat(paymentGateway.refunds().getFirst().idempotencyKey()).isEqualTo("refund-" + refunded.getId());
        assertThat(reload(refunded).getCancelledBy()).isEqualTo(TournamentRegistration.CANCELLED_BY_ADMIN);
        assertThat(reload(kept).getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(reload(kept).getRefund()).isNull();
        assertThat(placesTaken(tournament.getId())).isZero();
    }

    @Test
    void shouldRefuseASignUpFromAnotherTournament() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("admin-own", null, division);
        Tournament other = publishedTournament("admin-other", null, maleWhiteAdult("-76 kg"));
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        TournamentRegistration confirmed = confirmedSignUp(AOIFE, tournament, division);

        assertThat(adminCancel(other.getId(), confirmed.getId(), true).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(reload(confirmed).getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
    }

    @Test
    void shouldMergeTeamNamesWithinOneTournamentOnly() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("admin-merge", null, division);
        Tournament other = publishedTournament("admin-merge-other", null, maleWhiteAdult("-76 kg"));
        saveProfile(
                AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE, "{ \"name\": \"Team X\" }", "\"Alliance\"");
        saveProfile(
                CIARAN,
                "Ciaran",
                Gender.MALE,
                Belt.WHITE,
                ADULT_BIRTH_DATE,
                "{ \"name\": \"team x BJJ\" }",
                "\"alliance bjj\"");
        TournamentRegistration aoife = confirmedSignUp(AOIFE, tournament, division);
        TournamentRegistration ciaran = confirmedSignUp(CIARAN, tournament, division);
        TournamentRegistration elsewhere =
                confirmedSignUp(CIARAN, other, other.getDivisions().getFirst());

        ResponseEntity<String> academies = merge(
                tournament.getId(),
                "{ \"kind\": \"ACADEMY\", \"fromKeys\": [\"name:team x\", \"name:team x bjj\"], \"target\": \"Team X\" }");
        ResponseEntity<String> affiliations = merge(
                tournament.getId(),
                "{ \"kind\": \"AFFILIATION\", \"fromKeys\": [\"alliance bjj\"], \"target\": \"Alliance\" }");

        assertThat(academies.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(academies.getBody()).at("/updated").asInt())
                .isEqualTo(2);
        assertThat(objectMapper.readTree(affiliations.getBody()).at("/updated").asInt())
                .isEqualTo(1);
        for (TournamentRegistration registration : List.of(reload(aoife), reload(ciaran))) {
            assertThat(registration.getAcademy().name()).isEqualTo("Team X");
            assertThat(registration.getAcademyKey()).isEqualTo("name:team x");
            assertThat(registration.getAffiliation()).isEqualTo("Alliance");
            assertThat(registration.getAffiliationKey()).isEqualTo("alliance");
        }
        assertThat(reload(elsewhere).getAcademy().name()).isEqualTo("team x BJJ");
        assertThat(reload(elsewhere).getAffiliation()).isEqualTo("alliance bjj");
    }

    @Test
    void shouldRefuseEveryAdminSignUpToolToCompetitorsAndVisitors() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("admin-refused", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        TournamentRegistration confirmed = confirmedSignUp(AOIFE, tournament, division);
        String base = ApiRoutes.TOURNAMENT + "/" + tournament.getId();

        for (String token : new String[] {AOIFE, null}) {
            List<ResponseEntity<String>> responses = List.of(
                    restTemplate.exchange(base + "/registration", HttpMethod.GET, jsonEntity("", token), String.class),
                    restTemplate.exchange(
                            base + "/registration/" + confirmed.getId() + "/division",
                            HttpMethod.PUT,
                            jsonEntity("{ \"divisionId\": \"" + division.getId() + "\" }", token),
                            String.class),
                    restTemplate.exchange(
                            base + "/registration/" + confirmed.getId() + "/cancel",
                            HttpMethod.POST,
                            jsonEntity("{ \"refund\": true }", token),
                            String.class),
                    restTemplate.exchange(
                            base + "/team-merge",
                            HttpMethod.POST,
                            jsonEntity("{ \"kind\": \"ACADEMY\", \"fromKeys\": [\"x\"], \"target\": \"Y\" }", token),
                            String.class));
            HttpStatus expected = token == null ? HttpStatus.UNAUTHORIZED : HttpStatus.FORBIDDEN;
            assertThat(responses)
                    .allSatisfy(response -> assertThat(response.getStatusCode()).isEqualTo(expected));
        }
        assertThat(reload(confirmed).getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
    }

    private ResponseEntity<String> get(String tournamentId, String query, String token) {
        return restTemplate.exchange(
                ApiRoutes.TOURNAMENT + "/" + tournamentId + "/registration" + query,
                HttpMethod.GET,
                jsonEntity("", token),
                String.class);
    }

    private ResponseEntity<String> adminCancel(String tournamentId, String registrationId, boolean refund) {
        return restTemplate.exchange(
                ApiRoutes.TOURNAMENT + "/" + tournamentId + "/registration/" + registrationId + "/cancel",
                HttpMethod.POST,
                jsonEntity("{ \"refund\": " + refund + " }", ADMIN),
                String.class);
    }

    private ResponseEntity<String> merge(String tournamentId, String body) {
        return restTemplate.exchange(
                ApiRoutes.TOURNAMENT + "/" + tournamentId + "/team-merge",
                HttpMethod.POST,
                jsonEntity(body, ADMIN),
                String.class);
    }

    private static List<String> fieldNames(JsonNode row) {
        List<String> names = new ArrayList<>();
        row.propertyNames().forEach(names::add);
        return names;
    }

    private static JsonNode rowFor(JsonNode rows, String displayName) {
        for (JsonNode row : rows) {
            if (displayName.equals(row.at("/displayName").asString())) {
                return row;
            }
        }
        throw new AssertionError("No row for " + displayName);
    }
}
