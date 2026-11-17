package com.bjjeire.api.bjjeirecompetition;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.competitor.Academy;
import com.bjjeire.api.registration.BjjEireCompetitionRegistration;
import com.bjjeire.api.registration.Payment;
import com.bjjeire.api.registration.PaymentStatus;
import com.bjjeire.api.registration.RegistrationStatus;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import org.bson.types.ObjectId;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

/**
 * Helpers shared by the results and leaderboard integration tests. Adds no Spring configuration, so it reuses the one
 * shared context. Sign-ups are inserted directly as confirmed: how they got there is the registration tests' concern.
 */
abstract class ResultsIntegrationTest extends MongoIntegrationTest {
    static final String ADMIN_TOKEN = "integration-test-token";

    /** A well-formed id no document has. Named, so it never sits beside a token on one line (gitleaks). */
    static final String UNKNOWN_ID = "665f1c2b9b1e8a0012345678";

    BjjEireCompetition publishedWith(String slug, Division... divisions) {
        BjjEireCompetition competition = BjjEireCompetitionTestData.competition(
                slug, BjjEireCompetitionStatus.PUBLISHED, LocalDate.of(2026, 6, 27));
        competition.setDivisions(new java.util.ArrayList<>(List.of(divisions)));
        competition.setVersion(0L);
        return mongoTemplate.insert(competition);
    }

    String confirmed(
            BjjEireCompetition competition, Division division, String name, String academy, String affiliation) {
        return insertRegistration(competition, division, name, academy, affiliation, RegistrationStatus.CONFIRMED);
    }

    String insertRegistration(
            BjjEireCompetition competition,
            Division division,
            String name,
            String academy,
            String affiliation,
            RegistrationStatus status) {
        boolean active = status == RegistrationStatus.CONFIRMED || status == RegistrationStatus.AWAITING_PAYMENT;
        BjjEireCompetitionRegistration registration = BjjEireCompetitionRegistration.builder()
                .id(new ObjectId().toHexString())
                .competitionId(competition.getId())
                .divisionId(division.getId())
                .competitorId(new ObjectId().toHexString())
                .status(status)
                .active(active ? Boolean.TRUE : null)
                .displayName(name)
                .academy(academy == null ? null : new Academy(null, academy))
                .academyKey(academy == null ? null : "name:" + academy.toLowerCase(Locale.ROOT))
                .affiliation(affiliation)
                .affiliationKey(affiliation == null ? null : affiliation.toLowerCase(Locale.ROOT))
                .payment(Payment.builder()
                        .amountCents(2500)
                        .currency("EUR")
                        .status(status == RegistrationStatus.CONFIRMED ? PaymentStatus.PAID : PaymentStatus.PENDING)
                        .paymentIntentId("pi_" + name.replace(' ', '_'))
                        .build())
                .createdOnUtc(FIXED_NOW)
                .build();
        return mongoTemplate.insert(registration).getId();
    }

    ResponseEntity<String> recordResult(
            String token, String competitionId, String divisionId, String gold, String silver, String... bronzes) {
        String bronzeJson = String.join(
                ", ",
                java.util.Arrays.stream(bronzes).map(id -> "\"" + id + "\"").toList());
        String body = """
            { "goldRegistrationId": %s, "silverRegistrationId": %s, "bronzeRegistrationIds": [%s] }
            """.formatted(quoted(gold), quoted(silver), bronzeJson);
        return restTemplate.exchange(
                resultPath(competitionId, divisionId), HttpMethod.PUT, jsonEntity(body, token), String.class);
    }

    ResponseEntity<String> clearResult(String token, String competitionId, String divisionId) {
        return restTemplate.exchange(
                resultPath(competitionId, divisionId), HttpMethod.DELETE, jsonEntity(null, token), String.class);
    }

    ResponseEntity<String> finish(String token, String competitionId) {
        return restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competitionId + "/finish",
                HttpMethod.POST,
                jsonEntity("", token),
                String.class);
    }

    ResponseEntity<String> leaderboard(String competitionId) {
        return restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competitionId + "/leaderboard",
                HttpMethod.GET,
                jsonEntity(null, null),
                String.class);
    }

    ResponseEntity<String> resultsForAdmin(String token, String competitionId) {
        return restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/admin/" + competitionId + "/result",
                HttpMethod.GET,
                jsonEntity(null, token),
                String.class);
    }

    static String resultPath(String competitionId, String divisionId) {
        return ApiRoutes.BJJEIRE_COMPETITION + "/" + competitionId + "/division/" + divisionId + "/result";
    }

    private static String quoted(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }
}
