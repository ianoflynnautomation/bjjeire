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
import org.springframework.http.HttpStatus;

/**
 * T107: every step of a sign-up's money is counted, so the alert rules in docs/registration-operations.md have a metric
 * to watch. Counters are shared by the one Spring context, so each test compares before and after.
 */
class RegistrationMetricsIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");

    @Autowired
    private MeterRegistry meterRegistry;

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
