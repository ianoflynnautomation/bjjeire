package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Division;
import com.bjjeire.api.tournament.Gender;
import com.bjjeire.api.tournament.Tournament;
import com.bjjeire.api.tournament.TournamentStatus;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** The signed Stripe webhook: the only thing that confirms a sign-up (ADR-0013, contracts/stripe-webhook.md). */
class StripeWebhookIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");

    @Test
    void shouldRefuseAMissingOrBadSignatureAndChangeNothing() {
        TournamentRegistration registration = startSignUp("bad-signature", null);
        String payload = checkoutEvent("evt_1", "checkout.session.completed", registration);

        ResponseEntity<String> unsigned = postWebhook(payload, null);
        ResponseEntity<String> wrongSecret = postWebhook(payload, signature(payload, FIXED_NOW, "whsec_wrong"));
        ResponseEntity<String> tampered =
                postWebhook(payload.replace("\"paid\"", "\"paid\" "), signature(payload, FIXED_NOW, WEBHOOK_SECRET));
        ResponseEntity<String> stale =
                postWebhook(payload, signature(payload, FIXED_NOW.minus(Duration.ofHours(1)), WEBHOOK_SECRET));

        assertThat(List.of(unsigned, wrongSecret, tampered, stale))
                .allSatisfy(response -> assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThat(onlyRegistration().getStatus()).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);
        assertThat(mongoTemplate.count(new Query(), StripeEvent.class)).isZero();
        assertThat(mailer.sent()).isEmpty();
    }

    @Test
    @Tag("#5015")
    void shouldConfirmTheSignUpAndSendOneMailWhenThePaymentSucceeds() {
        TournamentRegistration registration = startSignUp("paid", null);

        ResponseEntity<String> response =
                postSignedWebhook(checkoutEvent("evt_paid", "checkout.session.completed", registration));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        TournamentRegistration confirmed = onlyRegistration();
        assertThat(confirmed.getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
        assertThat(confirmed.getActive()).isTrue();
        assertThat(confirmed.getHoldExpiresAt()).isNull();
        assertThat(confirmed.getPayment().getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(confirmed.getPayment().getPaidAt()).isEqualTo(FIXED_NOW);
        assertThat(confirmed.getPayment().getPaymentIntentId()).isEqualTo("pi_test_" + registration.getId());
        List<MailMessage> sent = mailer.awaitSent(1);
        assertThat(sent).hasSize(1);
        assertThat(sent.getFirst().to()).isEqualTo(competitorEmail("aoife"));
        assertThat(sent.getFirst().subject()).contains("confirmed");
        assertThat(sent.getFirst().body())
                .contains("BjjEire paid")
                .contains("-76 kg")
                .contains("€25.00");
        assertThat(placesTaken(registration.getTournamentId())).isEqualTo(1);
    }

    @Test
    @Tag("#5015")
    void shouldChangeNothingWhenTheSameEventArrivesTwice() {
        TournamentRegistration registration = startSignUp("twice", null);
        String payload = checkoutEvent("evt_twice", "checkout.session.completed", registration);

        postSignedWebhook(payload);
        ResponseEntity<String> again = postSignedWebhook(payload);

        assertThat(again.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(onlyRegistration().getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
        mailer.awaitSent(2);
        assertThat(mailer.sent()).hasSize(1);
        assertThat(mongoTemplate.count(new Query(), StripeEvent.class)).isEqualTo(1);
        StripeEvent ledger = mongoTemplate.findById("evt_twice", StripeEvent.class);
        assertThat(ledger.getExpiresAt()).isEqualTo(FIXED_NOW.plus(Duration.ofDays(30)));
    }

    @Test
    @Tag("#5015")
    void shouldNotConfirmTwiceWhenStripeSendsADifferentEventForTheSamePayment() {
        TournamentRegistration registration = startSignUp("two-events", null);

        postSignedWebhook(checkoutEvent("evt_a", "checkout.session.completed", registration));
        postSignedWebhook(checkoutEvent("evt_b", "checkout.session.completed", registration));

        mailer.awaitSent(2);
        assertThat(mailer.sent()).hasSize(1);
        assertThat(placesTaken(registration.getTournamentId())).isEqualTo(1);
    }

    @Test
    @Tag("#5016")
    void shouldExpireTheSignUpAndGiveThePlaceBackWhenTheCheckoutExpires() {
        TournamentRegistration registration = startSignUp("expired", 1);

        ResponseEntity<String> response =
                postSignedWebhook(checkoutEvent("evt_expired", "checkout.session.expired", registration));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        TournamentRegistration expired = onlyRegistration();
        assertThat(expired.getStatus()).isEqualTo(RegistrationStatus.EXPIRED);
        assertThat(expired.getActive()).isNull();
        assertThat(expired.getPayment().getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(placesTaken(registration.getTournamentId())).isZero();
        assertThat(paymentGateway.refunds()).isEmpty();
        assertThat(mailer.sent()).isEmpty();

        // The competitor can try again.
        assertThat(signUp(AOIFE, registration.getTournamentId(), registration.getDivisionId())
                        .getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @Tag("#5015")
    void shouldConfirmAPaymentStartedWhileRegistrationWasOpenEvenAfterItCloses() {
        TournamentRegistration registration = startSignUp("late-close", null);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getTournamentId())),
                Update.update("registrationClosesAt", FIXED_NOW.minusSeconds(60)),
                Tournament.class);

        postSignedWebhook(checkoutEvent("evt_after_close", "checkout.session.completed", registration));

        assertThat(onlyRegistration().getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
    }

    @Test
    @Tag("#5015")
    void shouldConfirmALatePaymentWhenAPlaceIsStillFree() {
        TournamentRegistration registration = startSignUp("late-free", 2);
        expireByHand(registration);

        postSignedWebhook(checkoutEvent("evt_late_free", "checkout.session.completed", registration));

        TournamentRegistration confirmed = onlyRegistration();
        assertThat(confirmed.getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
        assertThat(confirmed.getActive()).isTrue();
        assertThat(placesTaken(registration.getTournamentId())).isEqualTo(1);
        assertThat(paymentGateway.refunds()).isEmpty();
    }

    @Test
    @Tag("#5020")
    void shouldRefundALatePaymentInFullWhenNoPlaceIsLeft() {
        TournamentRegistration registration = startSignUp("late-full", 1);
        expireByHand(registration);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        assertThat(signUp(CIARAN, registration.getTournamentId(), registration.getDivisionId())
                        .getStatusCode())
                .isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> response =
                postSignedWebhook(checkoutEvent("evt_late_full", "checkout.session.completed", registration));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        TournamentRegistration refunded = mongoTemplate.findById(registration.getId(), TournamentRegistration.class);
        assertThat(refunded.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(refunded.getActive()).isNull();
        assertThat(refunded.getPayment().getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(refunded.getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        assertThat(refunded.getRefund().getAmountCents()).isEqualTo(2500);
        assertThat(refunded.getCancelledBy()).isEqualTo("SYSTEM");
        assertThat(paymentGateway.refunds()).singleElement().satisfies(refund -> {
            assertThat(refund.amountCents()).isEqualTo(2500);
            assertThat(refund.paymentIntentId()).isEqualTo("pi_test_" + registration.getId());
            assertThat(refund.idempotencyKey()).isEqualTo("refund-" + registration.getId());
        });
        assertThat(placesTaken(registration.getTournamentId())).isEqualTo(1);
        List<MailMessage> sent = mailer.awaitSent(1);
        assertThat(sent)
                .singleElement()
                .satisfies(mail -> assertThat(mail.body()).contains("refund"));
    }

    @Test
    void shouldAcknowledgeEventTypesItDoesNotHandle() {
        TournamentRegistration registration = startSignUp("unknown-type", null);

        ResponseEntity<String> response =
                postSignedWebhook(checkoutEvent("evt_other", "customer.created", registration));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(onlyRegistration().getStatus()).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);
    }

    @Test
    void shouldAcknowledgeAPaymentForASignUpItDoesNotKnow() {
        TournamentRegistration registration = startSignUp("unknown-registration", null);
        mongoTemplate.remove(new Query(), TournamentRegistration.class);

        ResponseEntity<String> response =
                postSignedWebhook(checkoutEvent("evt_unknown", "checkout.session.completed", registration));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void shouldLeaveACancelledTournamentsSignUpForTheOrganiserWhenAPlaceCannotBeRetaken() {
        TournamentRegistration registration = startSignUp("late-cancelled", null);
        expireByHand(registration);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getTournamentId())),
                Update.update("status", TournamentStatus.CANCELLED),
                Tournament.class);

        postSignedWebhook(checkoutEvent("evt_late_cancelled", "checkout.session.completed", registration));

        TournamentRegistration refunded = onlyRegistration();
        assertThat(refunded.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(paymentGateway.refunds()).hasSize(1);
    }

    @Test
    @Tag("#5015")
    void shouldApplyStripesRetryWhenTheFirstDeliveryFailed() {
        TournamentRegistration registration = startSignUp("retry", 1);
        expireByHand(registration);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(CIARAN, registration.getTournamentId(), registration.getDivisionId());
        paymentGateway.failNextRefunds(true);
        String payload = checkoutEvent("evt_retry", "checkout.session.completed", registration);

        ResponseEntity<String> failed = postSignedWebhook(payload);

        assertThat(failed.getStatusCode().is5xxServerError()).isTrue();
        TournamentRegistration recorded = mongoTemplate.findById(registration.getId(), TournamentRegistration.class);
        // The money is held: the payment is recorded and the refund marked failed for the organiser to see.
        assertThat(recorded.getPayment().getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(recorded.getRefund().getStatus()).isEqualTo(RefundStatus.FAILED);

        paymentGateway.failNextRefunds(false);
        ResponseEntity<String> retried = postSignedWebhook(payload);

        assertThat(retried.getStatusCode()).isEqualTo(HttpStatus.OK);
        TournamentRegistration refunded = mongoTemplate.findById(registration.getId(), TournamentRegistration.class);
        assertThat(refunded.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(refunded.getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        assertThat(paymentGateway.refunds()).hasSize(1);
    }

    @Test
    @Tag("#5020")
    void shouldStayOnTheRefundOnceARefundWasTriedEvenIfAPlaceComesFree() {
        TournamentRegistration registration = startSignUp("refund-then-free", 1);
        expireByHand(registration);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(CIARAN, registration.getTournamentId(), registration.getDivisionId());
        paymentGateway.failNextRefunds(true);
        String payload = checkoutEvent("evt_refund_then_free", "checkout.session.completed", registration);
        postSignedWebhook(payload);

        // Ciaran's hold lapses before Stripe retries: a place is free again.
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("divisionId")
                        .is(registration.getDivisionId())
                        .and("competitorId")
                        .ne(registration.getCompetitorId())),
                new Update()
                        .set("status", RegistrationStatus.EXPIRED)
                        .unset("active")
                        .unset("unpaidSlot")
                        .unset("holdExpiresAt"),
                TournamentRegistration.class);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getTournamentId())),
                new Update().inc("placesTaken", -1),
                Tournament.class);
        paymentGateway.failNextRefunds(false);

        ResponseEntity<String> retried = postSignedWebhook(payload);

        assertThat(retried.getStatusCode()).isEqualTo(HttpStatus.OK);
        TournamentRegistration refunded = mongoTemplate.findById(registration.getId(), TournamentRegistration.class);
        assertThat(refunded.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(refunded.getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        assertThat(placesTaken(registration.getTournamentId())).isZero();
    }

    @Test
    @Tag("#5015")
    void shouldApplyAnEventWhoseEarlierDeliveryWasRecordedButNeverFinished() {
        TournamentRegistration registration = startSignUp("crashed", null);
        // What a pod that died between recording the event and applying it leaves behind.
        mongoTemplate.insert(StripeEvent.builder()
                .id("evt_crashed")
                .type("checkout.session.completed")
                .receivedAt(FIXED_NOW)
                .expiresAt(FIXED_NOW.plus(Duration.ofDays(30)))
                .handled(false)
                .build());

        ResponseEntity<String> response =
                postSignedWebhook(checkoutEvent("evt_crashed", "checkout.session.completed", registration));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(onlyRegistration().getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
        assertThat(mongoTemplate.findById("evt_crashed", StripeEvent.class).isHandled())
                .isTrue();
    }

    @Test
    @Tag("#5015")
    void shouldConfirmWhenADelayedPaymentSucceedsAndNotBefore() {
        TournamentRegistration registration = startSignUp("async", null);
        String completedUnpaid = checkoutEvent("evt_async_completed", "checkout.session.completed", registration)
                .replace("\"payment_status\": \"paid\"", "\"payment_status\": \"unpaid\"");

        postSignedWebhook(completedUnpaid);
        assertThat(onlyRegistration().getStatus()).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);

        postSignedWebhook(checkoutEvent("evt_async_paid", "checkout.session.async_payment_succeeded", registration));
        assertThat(onlyRegistration().getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
    }

    @Test
    @Tag("#5016")
    void shouldExpireTheSignUpWhenADelayedPaymentFails() {
        TournamentRegistration registration = startSignUp("async-failed", null);

        postSignedWebhook(checkoutEvent("evt_async_failed", "checkout.session.async_payment_failed", registration));

        assertThat(onlyRegistration().getStatus()).isEqualTo(RegistrationStatus.EXPIRED);
        assertThat(placesTaken(registration.getTournamentId())).isZero();
    }

    @Test
    void shouldAnswerAMethodTheWebhookDoesNotHaveWithMethodNotAllowed() {
        ResponseEntity<String> response = restTemplate.exchange(
                com.bjjeire.api.common.ApiRoutes.STRIPE_WEBHOOK,
                org.springframework.http.HttpMethod.GET,
                jsonEntity(null, null),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
    }

    private TournamentRegistration startSignUp(String slug, Integer limit) {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament(slug, limit, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        assertThat(signUp(AOIFE, tournament.getId(), division.getId()).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
        return onlyRegistration();
    }

    /** What the hold sweep does when the expiry webhook never came. */
    private void expireByHand(TournamentRegistration registration) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getId())),
                new Update()
                        .set("status", RegistrationStatus.EXPIRED)
                        .unset("active")
                        .unset("unpaidSlot")
                        .unset("holdExpiresAt"),
                TournamentRegistration.class);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getTournamentId())),
                new Update().inc("placesTaken", -1),
                Tournament.class);
    }
}
