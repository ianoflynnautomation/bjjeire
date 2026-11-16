package com.bjjeire.api.registration;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import com.bjjeire.api.tournament.AgeCategory;
import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Discipline;
import com.bjjeire.api.tournament.Division;
import com.bjjeire.api.tournament.Gender;
import com.bjjeire.api.tournament.Tournament;
import com.bjjeire.api.tournament.TournamentStatus;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.bson.types.ObjectId;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * Helpers shared by the sign-up integration tests. Adds no Spring configuration, so it reuses the one shared context.
 */
abstract class RegistrationIntegrationTest extends MongoIntegrationTest {
    /** Must match bjjeire.stripe.webhook-secret in src/test/resources/application.yml. */
    static final String WEBHOOK_SECRET = "whsec_integration_test_secret";

    static final LocalDate TOURNAMENT_DAY = LocalDate.of(2026, 6, 27);
    static final Instant OPENS_AT = Instant.parse("2026-05-01T09:00:00Z");
    static final Instant CLOSES_AT = Instant.parse("2026-06-20T20:00:00Z");

    /** Born 1990: 36 on the tournament day. */
    static final String ADULT_BIRTH_DATE = "1990-04-12";

    /** Seventeen on the tournament day, eighteen the day after. */
    static final String EIGHTEEN_THE_DAY_AFTER = "2008-06-28";

    static Division division(Discipline discipline, Gender gender, AgeCategory category, Belt belt, String weight) {
        return Division.builder()
                .id(new ObjectId().toHexString())
                .discipline(discipline)
                .gender(gender)
                .ageCategory(category)
                .belt(belt)
                .weightClass(weight)
                .build();
    }

    static Division maleWhiteAdult(String weight) {
        return division(Discipline.GI, Gender.MALE, AgeCategory.ADULT, Belt.WHITE, weight);
    }

    Tournament publishedTournament(String slug, Integer competitorLimit, Division... divisions) {
        return insertTournament(slug, TournamentStatus.PUBLISHED, OPENS_AT, CLOSES_AT, competitorLimit, divisions);
    }

    Tournament insertTournament(
            String slug,
            TournamentStatus status,
            Instant opensAt,
            Instant closesAt,
            Integer competitorLimit,
            Division... divisions) {
        Tournament tournament = Tournament.builder()
                .slug(slug)
                .name("BjjEire " + slug)
                .description("An in-house tournament.")
                .date(TOURNAMENT_DAY)
                .venue(new Location(
                        "1 Main Street",
                        "National Arena",
                        new GeoCoordinates("Point", List.of(-6.26, 53.35), null, null)))
                .entryFeeCents(2500)
                .registrationOpensAt(opensAt)
                .registrationClosesAt(closesAt)
                .competitorLimit(competitorLimit)
                .status(status)
                .version(0L)
                .divisions(List.of(divisions))
                .build();
        return mongoTemplate.insert(tournament);
    }

    /** Saves a complete profile for the competitor behind {@code token}. */
    void saveProfile(String token, String firstName, Gender gender, Belt belt, String dateOfBirth) {
        saveProfile(token, firstName, gender, belt, dateOfBirth, "{ \"name\": \"Team X\" }", "\"Alliance\"");
    }

    void saveProfile(
            String token,
            String firstName,
            Gender gender,
            Belt belt,
            String dateOfBirth,
            String academyJson,
            String affiliationJson) {
        String body = """
            {
              "firstName": "%s",
              "lastName": "Byrne",
              "nationality": "IE",
              "dateOfBirth": "%s",
              "gender": "%s",
              "belt": "%s",
              "academy": %s,
              "affiliation": %s,
              "phone": "+353 87 123 4567"
            }
            """.formatted(firstName, dateOfBirth, gender, belt, academyJson, affiliationJson);
        ResponseEntity<String> saved = restTemplate.exchange(
                ApiRoutes.COMPETITOR + "/me", HttpMethod.PUT, jsonEntity(body, token), String.class);
        if (!saved.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException("Profile save failed: " + saved.getBody());
        }
    }

    ResponseEntity<String> signUp(String token, String tournamentId, String divisionId) {
        return signUp(token, tournamentId, divisionId, true, true);
    }

    ResponseEntity<String> signUp(
            String token, String tournamentId, String divisionId, boolean acceptListing, boolean acceptTerms) {
        String body = """
            { "tournamentId": "%s", "divisionId": "%s", "acceptPublicListing": %s, "acceptTerms": %s }
            """.formatted(tournamentId, divisionId, acceptListing, acceptTerms);
        return restTemplate.exchange(ApiRoutes.REGISTRATION, HttpMethod.POST, jsonEntity(body, token), String.class);
    }

    TournamentRegistration onlyRegistration() {
        List<TournamentRegistration> all = mongoTemplate.findAll(TournamentRegistration.class);
        if (all.size() != 1) {
            throw new IllegalStateException("Expected one registration, found " + all.size());
        }
        return all.getFirst();
    }

    int placesTaken(String tournamentId) {
        return mongoTemplate.findById(tournamentId, Tournament.class).getPlacesTaken();
    }

    // ---- Stripe webhook ---------------------------------------------------------------------------------------

    static String checkoutEvent(String eventId, String type, TournamentRegistration registration) {
        return """
            {
              "id": "%s",
              "object": "event",
              "type": "%s",
              "data": {
                "object": {
                  "id": "%s",
                  "object": "checkout.session",
                  "client_reference_id": "%s",
                  "metadata": { "registrationId": "%s" },
                  "payment_intent": "pi_test_%s",
                  "payment_status": "%s",
                  "amount_total": %d,
                  "currency": "eur"
                }
              }
            }
            """.formatted(
                        eventId,
                        type,
                        registration.getPayment().getCheckoutSessionId(),
                        registration.getId(),
                        registration.getId(),
                        registration.getId(),
                        type.endsWith("expired") ? "unpaid" : "paid",
                        registration.getPayment().getAmountCents());
    }

    ResponseEntity<String> postSignedWebhook(String payload) {
        return postWebhook(payload, signature(payload, FIXED_NOW, WEBHOOK_SECRET));
    }

    ResponseEntity<String> postWebhook(String payload, String signatureHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (signatureHeader != null) {
            headers.set("Stripe-Signature", signatureHeader);
        }
        return restTemplate.exchange(
                ApiRoutes.STRIPE_WEBHOOK, HttpMethod.POST, new HttpEntity<>(payload, headers), String.class);
    }

    /** A {@code Stripe-Signature} header as Stripe builds it: HMAC-SHA256 over {@code timestamp.payload}. */
    static String signature(String payload, Instant timestamp, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String signed = timestamp.getEpochSecond() + "." + payload;
            String digest = HexFormat.of().formatHex(mac.doFinal(signed.getBytes(StandardCharsets.UTF_8)));
            return "t=" + timestamp.getEpochSecond() + ",v1=" + digest;
        } catch (java.security.GeneralSecurityException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
