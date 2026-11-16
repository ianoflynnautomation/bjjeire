package com.bjjeire.api.registration;

import static com.bjjeire.api.testsupport.RetiredNames.OLD_NAME;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import com.bjjeire.api.common.ApiRoutes;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.ObjectMapper;

/** Stripe reports what became of a refund (contracts/stripe-webhook.md § Refund succeeded / failed). */
class RefundWebhookIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MeterRegistry meterRegistry;

    @Test
    @Tag("#5022")
    @Tag("#5027")
    void shouldMarkThePendingRefundRefundedAndMailTheCompetitorWhenStripeReportsItSucceeded() {
        BjjEireCompetitionRegistration cancelled = cancelledWithPendingRefund("refund-ok");
        mailer.reset();

        ResponseEntity<String> response =
                postSignedWebhook(refundEvent("evt_refund_ok", "refund.updated", "succeeded", cancelled));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        BjjEireCompetitionRegistration refunded = reload(cancelled);
        assertThat(refunded.getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        assertThat(refunded.getRefund().getCompletedAt()).isEqualTo(FIXED_NOW);
        List<MailMessage> sent = mailer.awaitSent(1);
        assertThat(sent).hasSize(1);
        assertThat(sent.getFirst().to()).isEqualTo(competitorEmail("aoife"));
        assertThat(sent.getFirst().subject()).contains("Refund");
        assertThat(sent.getFirst().body()).contains("€25.00");
        assertThat(sent.getFirst().subject() + sent.getFirst().body()).doesNotContainIgnoringCase(OLD_NAME);
    }

    @Test
    @Tag("#5022")
    void shouldChangeNothingAndSendNoSecondMailWhenTheRefundEventArrivesAgain() {
        BjjEireCompetitionRegistration cancelled = cancelledWithPendingRefund("refund-twice");
        mailer.reset();
        postSignedWebhook(refundEvent("evt_refund_a", "refund.updated", "succeeded", cancelled));
        mailer.awaitSent(1);

        ResponseEntity<String> again =
                postSignedWebhook(refundEvent("evt_refund_b", "refund.updated", "succeeded", cancelled));

        assertThat(again.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(reload(cancelled).getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        assertThat(mailer.awaitSent(2)).hasSize(1);
    }

    @Test
    void shouldRecordAFailedRefundRaiseTheAlertAndShowTheCompetitorRefundPending() {
        BjjEireCompetitionRegistration cancelled = cancelledWithPendingRefund("refund-failed");
        double before = refundFailures();

        ResponseEntity<String> response =
                postSignedWebhook(refundEvent("evt_refund_failed", "refund.failed", "failed", cancelled));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        BjjEireCompetitionRegistration failed = reload(cancelled);
        assertThat(failed.getRefund().getStatus()).isEqualTo(RefundStatus.FAILED);
        assertThat(failed.getRefund().getFailureReason()).isEqualTo("expired_or_canceled_card");
        assertThat(refundFailures()).isEqualTo(before + 1);
        ResponseEntity<String> own = restTemplate.exchange(
                ApiRoutes.REGISTRATION + "/me", HttpMethod.GET, jsonEntity("", AOIFE), String.class);
        assertThat(objectMapper.readTree(own.getBody()).at("/0/refundStatus").asString())
                .isEqualTo("FAILED");
    }

    @Test
    void shouldIgnoreARefundEventForAnotherRefundOfTheSameSignUp() {
        BjjEireCompetitionRegistration cancelled = cancelledWithPendingRefund("refund-other");
        String payload = refundEvent("evt_refund_other", "refund.updated", "succeeded", cancelled)
                .replace(cancelled.getRefund().getRefundId(), "re_someone_else");

        ResponseEntity<String> response = postSignedWebhook(payload);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(reload(cancelled).getRefund().getStatus()).isEqualTo(RefundStatus.PENDING);
    }

    @Test
    void shouldLeaveARefundPendingWhileStripeStillReportsItPending() {
        BjjEireCompetitionRegistration cancelled = cancelledWithPendingRefund("refund-still-pending");

        postSignedWebhook(refundEvent("evt_refund_created", "refund.created", "pending", cancelled));

        assertThat(reload(cancelled).getRefund().getStatus()).isEqualTo(RefundStatus.PENDING);
    }

    private BjjEireCompetitionRegistration cancelledWithPendingRefund(String slug) {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition(slug, null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, division);
        paymentGateway.reportRefundsPending(true);
        int mails = mailer.sent().size();
        assertThat(cancel(AOIFE, confirmed.getId()).getStatusCode()).isEqualTo(HttpStatus.OK);
        mailer.awaitSent(mails + 1);
        return reload(confirmed);
    }

    private double refundFailures() {
        return meterRegistry
                .counter(RegistrationServiceImpl.REFUND_FAILURE_METRIC)
                .count();
    }
}
