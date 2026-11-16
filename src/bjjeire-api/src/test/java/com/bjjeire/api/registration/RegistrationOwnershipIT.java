package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import com.bjjeire.api.common.ApiRoutes;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** A competitor's own sign-ups, and nobody else's (#5021, contract invariant "ownership"). */
class RegistrationOwnershipIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");
    private static final String ME = ApiRoutes.REGISTRATION + "/me";

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5021")
    void shouldListOnlyTheCallersSignUpsWithBjjEireCompetitionDivisionAmountAndStatus() throws Exception {
        Division lightweight = maleWhiteAdult("-70 kg");
        Division middleweight = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("mine", null, lightweight, middleweight);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), lightweight.getId());
        signUp(CIARAN, competition.getId(), middleweight.getId());
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("divisionId").is(lightweight.getId())),
                new Update()
                        .set("status", RegistrationStatus.CONFIRMED)
                        .set("payment.status", PaymentStatus.PAID)
                        .unset("unpaidSlot"),
                BjjEireCompetitionRegistration.class);

        ResponseEntity<String> response = get(ME, AOIFE);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.size()).isEqualTo(1);
        JsonNode mine = body.get(0);
        assertThat(mine.at("/competitionId").asString()).isEqualTo(competition.getId());
        assertThat(mine.at("/competitionSlug").asString()).isEqualTo("mine");
        assertThat(mine.at("/competitionName").asString()).isEqualTo("BjjEire mine");
        assertThat(mine.at("/competitionDate").asString()).isEqualTo("2026-06-27");
        assertThat(mine.at("/division/id").asString()).isEqualTo(lightweight.getId());
        assertThat(mine.at("/division/weightClass").asString()).isEqualTo("-70 kg");
        assertThat(mine.at("/amountCents").asInt()).isEqualTo(2500);
        assertThat(mine.at("/currency").asString()).isEqualTo("EUR");
        assertThat(mine.at("/status").asString()).isEqualTo("CONFIRMED");
        assertThat(mine.at("/paymentStatus").asString()).isEqualTo("PAID");
        assertThat(java.time.Instant.parse(mine.at("/refundableUntil").asString()))
                .isEqualTo(CLOSES_AT);
        assertThat(mine.has("competitorId")).isFalse();
        assertThat(mine.has("payment")).isFalse();
    }

    @Test
    @Tag("#5021")
    void shouldListNothingForACompetitorWithoutSignUpsOrProfile() throws Exception {
        assertThat(objectMapper.readTree(get(ME, AOIFE).getBody()).size()).isZero();
    }

    @Test
    @Tag("#5016")
    void shouldGiveTheOwnerTheOpenCheckoutAgainWhileTheHoldLasts() throws Exception {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("resume", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        String firstUrl = objectMapper
                .readTree(signUp(AOIFE, competition.getId(), division.getId()).getBody())
                .at("/checkoutUrl")
                .asString();
        BjjEireCompetitionRegistration registration = onlyRegistration();

        ResponseEntity<String> resumed = checkout(registration.getId(), AOIFE);

        assertThat(resumed.getStatusCode()).isEqualTo(HttpStatus.OK);
        // The same session: one sign-up never has two payable checkouts (FR-020).
        assertThat(objectMapper.readTree(resumed.getBody()).at("/checkoutUrl").asString())
                .isEqualTo(firstUrl);
        assertThat(paymentGateway.checkouts()).hasSize(1);
    }

    @Test
    @Tag("#5016")
    void shouldRefuseToResumeACheckoutWhoseHoldHasEnded() throws Exception {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("resume-late", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        BjjEireCompetitionRegistration registration = onlyRegistration();
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getId())),
                Update.update("holdExpiresAt", FIXED_NOW.minus(Duration.ofMinutes(1))),
                BjjEireCompetitionRegistration.class);

        ResponseEntity<String> resumed = checkout(registration.getId(), AOIFE);

        assertThat(resumed.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(objectMapper.readTree(resumed.getBody()).at("/type").asString())
                .isEqualTo("urn:bjjeire:hold-expired");
    }

    @Test
    @Tag("#5016")
    void shouldTellACompetitorWhoHasAlreadyPaidThatThePaymentIsBeingConfirmedNotSendThemBack() throws Exception {
        BjjEireCompetitionRegistration registration = startUnpaid("resume-paid");
        for (PaymentGateway.CheckoutStatus received :
                List.of(PaymentGateway.CheckoutStatus.PAID, PaymentGateway.CheckoutStatus.PROCESSING)) {
            paymentGateway.setCheckoutStatus(registration.getPayment().getCheckoutSessionId(), received);

            ResponseEntity<String> resumed = checkout(registration.getId(), AOIFE);

            assertThat(resumed.getStatusCode()).as(received.name()).isEqualTo(HttpStatus.CONFLICT);
            JsonNode body = objectMapper.readTree(resumed.getBody());
            assertThat(body.at("/type").asString()).isEqualTo("urn:bjjeire:payment-received");
            assertThat(resumed.getBody()).doesNotContain("checkout.stripe");
        }
        // Only the webhook confirms: asking Stripe changed nothing stored.
        assertThat(onlyRegistration().getStatus()).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);

        // The owner's case: paid, the webhook never came, and the 30-minute hold has since ended.
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getId())),
                Update.update("holdExpiresAt", FIXED_NOW.minus(Duration.ofHours(1))),
                BjjEireCompetitionRegistration.class);
        paymentGateway.setCheckoutStatus(
                registration.getPayment().getCheckoutSessionId(), PaymentGateway.CheckoutStatus.PAID);
        assertThat(objectMapper
                        .readTree(checkout(registration.getId(), AOIFE).getBody())
                        .at("/type")
                        .asString())
                .isEqualTo("urn:bjjeire:payment-received");
    }

    @Test
    @Tag("#5016")
    void shouldStillReturnTheOpenCheckoutWhenStripeCannotSayWhetherItWasPaid() throws Exception {
        BjjEireCompetitionRegistration registration = startUnpaid("resume-unknown");
        paymentGateway.failStatusLookups(true);

        ResponseEntity<String> resumed = checkout(registration.getId(), AOIFE);

        assertThat(resumed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(resumed.getBody()).at("/checkoutUrl").asString())
                .isEqualTo(registration.getPayment().getCheckoutUrl());
    }

    private BjjEireCompetitionRegistration startUnpaid(String slug) {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition(slug, null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        return onlyRegistration();
    }

    @Test
    void shouldRefuseAnotherCompetitorsSignUpOnEveryRouteThatTakesAnId() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("not-yours", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        BjjEireCompetitionRegistration aoifes = onlyRegistration();

        assertThat(checkout(aoifes.getId(), CIARAN).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(checkout(aoifes.getId(), competitorToken("no-profile")).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(checkout("665f1c2b9b1e8a0012345678", CIARAN).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void shouldRefuseVisitorsAndTheOrganiser() {
        assertThat(get(ME, null).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(get(ME, "organiser-token").getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(signUp(null, "665f1c2b9b1e8a0012345678", "665f1c2b9b1e8a0012345679")
                        .getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(signUp("organiser-token", "665f1c2b9b1e8a0012345678", "665f1c2b9b1e8a0012345679")
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    private ResponseEntity<String> get(String path, String token) {
        return restTemplate.exchange(path, HttpMethod.GET, jsonEntity(null, token), String.class);
    }

    private ResponseEntity<String> checkout(String registrationId, String token) {
        return restTemplate.exchange(
                ApiRoutes.REGISTRATION + "/" + registrationId + "/checkout",
                HttpMethod.POST,
                jsonEntity(null, token),
                String.class);
    }
}
