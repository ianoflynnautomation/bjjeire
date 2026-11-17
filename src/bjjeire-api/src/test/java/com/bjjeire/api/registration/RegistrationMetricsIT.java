package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;

/**
 * T107: every step of a sign-up's money is counted, so the alert rules in docs/registration-operations.md have a metric
 * to watch. Counters are shared by the one Spring context, so each test compares before and after.
 */
class RegistrationMetricsIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");

    @Autowired
    private MeterRegistry meterRegistry;

    @Autowired
    private RegistrationService registrationService;

    @Test
    void shouldCountASignUpStartedAndConfirmed() {
        double started = count(RegistrationMetrics.SIGNUP_STARTED);
        double confirmed = count(RegistrationMetrics.SIGNUP_CONFIRMED);
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("metrics-confirmed", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        confirmedSignUp(AOIFE, competition, division);

        assertThat(count(RegistrationMetrics.SIGNUP_STARTED)).isEqualTo(started + 1);
        assertThat(count(RegistrationMetrics.SIGNUP_CONFIRMED)).isEqualTo(confirmed + 1);
    }

    @Test
    void shouldCountASignUpWhoseCheckoutExpiredOnce() {
        double expired = count(RegistrationMetrics.SIGNUP_EXPIRED);
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("metrics-expired", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        assertThat(signUp(AOIFE, competition.getId(), division.getId()).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
        BjjEireCompetitionRegistration registration = onlyRegistration();

        postSignedWebhook(checkoutEvent("evt_metrics_expired", "checkout.session.expired", registration));
        postSignedWebhook(checkoutEvent("evt_metrics_expired_again", "checkout.session.expired", registration));

        assertThat(count(RegistrationMetrics.SIGNUP_EXPIRED)).isEqualTo(expired + 1);
    }

    @Test
    void shouldCountARefundRequestedAndSucceeded() {
        double requested = count(RegistrationMetrics.REFUND_REQUESTED);
        double succeeded = count(RegistrationMetrics.REFUND_SUCCEEDED);
        BjjEireCompetitionRegistration confirmed = confirmed("metrics-refund");

        assertThat(cancel(AOIFE, confirmed.getId()).getStatusCode()).isEqualTo(HttpStatus.OK);

        assertThat(count(RegistrationMetrics.REFUND_REQUESTED)).isEqualTo(requested + 1);
        assertThat(count(RegistrationMetrics.REFUND_SUCCEEDED)).isEqualTo(succeeded + 1);
    }

    @Test
    void shouldCountAPendingRefundAsSucceededOnlyWhenStripeReportsIt() {
        double succeeded = count(RegistrationMetrics.REFUND_SUCCEEDED);
        BjjEireCompetitionRegistration confirmed = confirmed("metrics-refund-pending");
        paymentGateway.reportRefundsPending(true);
        cancel(AOIFE, confirmed.getId());
        assertThat(count(RegistrationMetrics.REFUND_SUCCEEDED)).isEqualTo(succeeded);
        BjjEireCompetitionRegistration cancelled = reload(confirmed);

        postSignedWebhook(refundEvent("evt_metrics_refund_ok", "refund.updated", "succeeded", cancelled));
        postSignedWebhook(refundEvent("evt_metrics_refund_ok_again", "refund.updated", "succeeded", cancelled));

        assertThat(count(RegistrationMetrics.REFUND_SUCCEEDED)).isEqualTo(succeeded + 1);
    }

    @Test
    void shouldCountARefundStripeRefused() {
        double failed = count(RegistrationMetrics.REFUND_FAILED);
        BjjEireCompetitionRegistration confirmed = confirmed("metrics-refund-failed");
        paymentGateway.failNextRefunds(true);

        cancel(AOIFE, confirmed.getId());

        assertThat(count(RegistrationMetrics.REFUND_FAILED)).isEqualTo(failed + 1);
    }

    @Test
    void shouldCountARejectedWebhookByReason() {
        double signature = rejected("signature");
        double malformed = rejected("malformed");
        String notJson = "not json";

        postWebhook("{}", null);
        postWebhook("{}", signature("{}", FIXED_NOW, "whsec_wrong"));
        postWebhook(notJson, signature(notJson, FIXED_NOW, WEBHOOK_SECRET));

        assertThat(rejected("signature")).isEqualTo(signature + 2);
        assertThat(rejected("malformed")).isEqualTo(malformed + 1);
    }

    @Test
    void shouldCountALatePaymentConfirmedWithAFreePlace() {
        double confirmedBefore = count(RegistrationMetrics.SIGNUP_CONFIRMED);
        BjjEireCompetitionRegistration registration = started("metrics-late-free", 2);
        expireByHand(registration);

        postSignedWebhook(checkoutEvent("evt_metrics_late_free", "checkout.session.completed", registration));

        assertThat(reload(registration).getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
        assertThat(count(RegistrationMetrics.SIGNUP_CONFIRMED)).isEqualTo(confirmedBefore + 1);
    }

    @Test
    void shouldCountEveryAttemptToRefundALatePaymentAndTheOneSuccess() {
        double requested = count(RegistrationMetrics.REFUND_REQUESTED);
        double failed = count(RegistrationMetrics.REFUND_FAILED);
        double succeeded = count(RegistrationMetrics.REFUND_SUCCEEDED);
        double confirmed = count(RegistrationMetrics.SIGNUP_CONFIRMED);
        BjjEireCompetitionRegistration registration = started("metrics-late-full", 1);
        expireByHand(registration);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        assertThat(signUp(CIARAN, registration.getCompetitionId(), registration.getDivisionId())
                        .getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
        paymentGateway.failRefunds(1);
        String payload = checkoutEvent("evt_metrics_late_full", "checkout.session.completed", registration);

        // Stripe refuses the refund, the webhook answers 5xx, and Stripe retries the same event.
        assertThat(postSignedWebhook(payload).getStatusCode().is5xxServerError())
                .isTrue();
        assertThat(postSignedWebhook(payload).getStatusCode()).isEqualTo(HttpStatus.OK);

        // Attempts count each try; the outcome counts once (docs/registration-operations.md § Metrics).
        assertThat(count(RegistrationMetrics.REFUND_REQUESTED)).isEqualTo(requested + 2);
        assertThat(count(RegistrationMetrics.REFUND_FAILED)).isEqualTo(failed + 1);
        assertThat(count(RegistrationMetrics.REFUND_SUCCEEDED)).isEqualTo(succeeded + 1);
        assertThat(count(RegistrationMetrics.SIGNUP_CONFIRMED)).isEqualTo(confirmed);
        assertThat(reload(registration).getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
    }

    @Test
    void shouldCountASignedEventWithNoIdOrTypeAsMalformed() {
        double malformed = rejected("malformed");

        assertThat(postSignedWebhook("{}").getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        assertThat(rejected("malformed")).isEqualTo(malformed + 1);
    }

    @Test
    void shouldCountTheHoldsEndedWhenACompetitionIsCancelled() {
        double expired = count(RegistrationMetrics.SIGNUP_EXPIRED);
        BjjEireCompetitionRegistration registration = started("metrics-end-holds", null);

        assertThat(registrationService.endHolds(registration.getCompetitionId()))
                .isEqualTo(1);

        assertThat(count(RegistrationMetrics.SIGNUP_EXPIRED)).isEqualTo(expired + 1);
    }

    private BjjEireCompetitionRegistration started(String slug, Integer limit) {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition(slug, limit, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        assertThat(signUp(AOIFE, competition.getId(), division.getId()).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
        return onlyRegistration();
    }

    /** What the hold sweep does when the expiry webhook never came (as in StripeWebhookIT). */
    private void expireByHand(BjjEireCompetitionRegistration registration) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getId())),
                new Update()
                        .set("status", RegistrationStatus.EXPIRED)
                        .unset("active")
                        .unset("unpaidSlot")
                        .unset("holdExpiresAt"),
                BjjEireCompetitionRegistration.class);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getCompetitionId())),
                new Update().inc("placesTaken", -1),
                BjjEireCompetition.class);
    }

    private BjjEireCompetitionRegistration confirmed(String slug) {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition(slug, null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        return confirmedSignUp(AOIFE, competition, division);
    }

    private double count(String name) {
        Counter counter = meterRegistry.find(name).counter();
        return counter == null ? 0 : counter.count();
    }

    private double rejected(String reason) {
        Counter counter = meterRegistry
                .find(RegistrationMetrics.WEBHOOK_REJECTED)
                .tag("reason", reason)
                .counter();
        return counter == null ? 0 : counter.count();
    }
}
