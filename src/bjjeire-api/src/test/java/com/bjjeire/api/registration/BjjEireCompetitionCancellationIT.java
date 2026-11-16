package com.bjjeire.api.registration;

import static com.bjjeire.api.testsupport.RetiredNames.OLD_NAME;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.registration.PaymentGateway.RefundRequest;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.ObjectMapper;

/** The organiser cancels a whole competition (FR-029). */
class BjjEireCompetitionCancellationIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");
    private static final String NIAMH = competitorToken("niamh");

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5026")
    void shouldRefundEveryConfirmedSignUpInFullAndMailEachCompetitor() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-all", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration aoife = confirmedSignUp(AOIFE, competition, division);
        BjjEireCompetitionRegistration ciaran = confirmedSignUp(CIARAN, competition, division);
        mailer.reset();

        ResponseEntity<String> response = cancelBjjEireCompetition(competition.getId(), "integration-test-token");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(response.getBody()).at("/status").asString())
                .isEqualTo("CANCELLED");
        assertThat(mongoTemplate
                        .findById(competition.getId(), BjjEireCompetition.class)
                        .getStatus())
                .isEqualTo(BjjEireCompetitionStatus.CANCELLED);
        assertThat(paymentGateway.refunds())
                .extracting(RefundRequest::idempotencyKey)
                .containsExactlyInAnyOrder("refund-" + aoife.getId(), "refund-" + ciaran.getId());
        assertThat(paymentGateway.refunds())
                .allSatisfy(refund -> assertThat(refund.amountCents()).isEqualTo(2500));
        for (BjjEireCompetitionRegistration registration : List.of(reload(aoife), reload(ciaran))) {
            assertThat(registration.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
            assertThat(registration.getActive()).isNull();
            assertThat(registration.getCancelledBy())
                    .isEqualTo(BjjEireCompetitionRegistration.CANCELLED_BY_COMPETITION);
            assertThat(registration.getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        }
        assertThat(placesTaken(competition.getId())).isZero();
        List<MailMessage> sent = mailer.awaitSent(2);
        assertThat(sent)
                .extracting(MailMessage::to)
                .containsExactlyInAnyOrder(competitorEmail("aoife"), competitorEmail("ciaran"));
        assertThat(sent).allSatisfy(mail -> {
            assertThat(mail.subject()).contains("Competition cancelled");
            assertThat(mail.body()).contains("refund of €25.00");
            assertThat(mail.subject() + mail.body()).doesNotContainIgnoringCase(OLD_NAME);
        });
    }

    @Test
    @Tag("#5026")
    void shouldRetryOnlyTheRefundsThatFailedWhenTheCancellationIsRunAgain() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-rerun", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(NIAMH, "Niamh", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        confirmedSignUp(AOIFE, competition, division);
        confirmedSignUp(CIARAN, competition, division);
        confirmedSignUp(NIAMH, competition, division);
        paymentGateway.failRefunds(1);

        ResponseEntity<String> first = cancelBjjEireCompetition(competition.getId(), "integration-test-token");
        List<BjjEireCompetitionRegistration> afterFirst = mongoTemplate.findAll(BjjEireCompetitionRegistration.class);
        ResponseEntity<String> second = cancelBjjEireCompetition(competition.getId(), "integration-test-token");
        ResponseEntity<String> third = cancelBjjEireCompetition(competition.getId(), "integration-test-token");

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(afterFirst)
                .filteredOn(registration -> registration.getRefund().getStatus() == RefundStatus.FAILED)
                .hasSize(1);
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(third.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Two refunds the first time, the failed one the second time, nothing the third.
        assertThat(paymentGateway.refunds()).hasSize(3);
        assertThat(paymentGateway.refunds())
                .extracting(RefundRequest::idempotencyKey)
                .doesNotHaveDuplicates();
        assertThat(mongoTemplate.findAll(BjjEireCompetitionRegistration.class))
                .allSatisfy(registration ->
                        assertThat(registration.getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED));
    }

    @Test
    @Tag("#5026")
    void shouldAskStripeForANewRefundWhenOneItReportedFailedIsRetried() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-async-failure", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, division);
        paymentGateway.reportRefundsPending(true);
        cancelBjjEireCompetition(competition.getId(), "integration-test-token");
        postSignedWebhook(refundEvent("evt_refund_failed_async", "refund.failed", "failed", reload(confirmed)));
        assertThat(reload(confirmed).getRefund().getStatus()).isEqualTo(RefundStatus.FAILED);
        paymentGateway.reportRefundsPending(false);

        cancelBjjEireCompetition(competition.getId(), "integration-test-token");

        // Reusing the first key would only replay Stripe's first answer: the retry must create a new refund.
        assertThat(paymentGateway.refunds())
                .extracting(RefundRequest::idempotencyKey)
                .containsExactly("refund-" + confirmed.getId(), "refund-" + confirmed.getId() + "-2");
        BjjEireCompetitionRegistration retried = reload(confirmed);
        assertThat(retried.getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        assertThat(retried.getRefund().getAttempts()).isEqualTo(2);
    }

    @Test
    @Tag("#5026")
    void shouldAlsoRetryAFailedRefundOfASignUpCancelledBeforeTheBjjEireCompetition() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-own-failed", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, division);
        paymentGateway.failRefunds(1);
        cancel(AOIFE, confirmed.getId());
        assertThat(reload(confirmed).getRefund().getStatus()).isEqualTo(RefundStatus.FAILED);

        cancelBjjEireCompetition(competition.getId(), "integration-test-token");

        assertThat(reload(confirmed).getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        assertThat(reload(confirmed).getCancelledBy())
                .isEqualTo(BjjEireCompetitionRegistration.CANCELLED_BY_COMPETITOR);
    }

    @Test
    @Tag("#5026")
    void shouldAskStripeForANewRefundWhenALatePaymentRefundItReportedFailedIsRetried() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-late-refund-failed", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        BjjEireCompetitionRegistration unpaid = onlyRegistration();
        cancelBjjEireCompetition(competition.getId(), "integration-test-token");
        paymentGateway.reportRefundsPending(true);
        postSignedWebhook(checkoutEvent("evt_late_paid", "checkout.session.completed", unpaid));
        postSignedWebhook(refundEvent("evt_late_refund_failed", "refund.failed", "failed", reload(unpaid)));
        assertThat(reload(unpaid).getRefund().getStatus()).isEqualTo(RefundStatus.FAILED);
        paymentGateway.reportRefundsPending(false);

        cancelBjjEireCompetition(competition.getId(), "integration-test-token");

        assertThat(paymentGateway.refunds())
                .extracting(RefundRequest::idempotencyKey)
                .containsExactly("refund-" + unpaid.getId(), "refund-" + unpaid.getId() + "-2");
        assertThat(reload(unpaid).getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
    }

    @Test
    @Tag("#5026")
    void shouldEndUnpaidHoldsSoALatePaymentIsRefundedNotConfirmed() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-unpaid", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        BjjEireCompetitionRegistration unpaid = onlyRegistration();

        cancelBjjEireCompetition(competition.getId(), "integration-test-token");
        assertThat(reload(unpaid).getStatus()).isEqualTo(RegistrationStatus.EXPIRED);
        assertThat(placesTaken(competition.getId())).isZero();

        postSignedWebhook(checkoutEvent("evt_late", "checkout.session.completed", unpaid));

        BjjEireCompetitionRegistration late = reload(unpaid);
        assertThat(late.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(late.getRefund().getAmountCents()).isEqualTo(2500);
        assertThat(paymentGateway.refunds()).hasSize(1);
    }

    @Test
    void shouldRefuseCompetitorsAndVisitorsAndAFinishedBjjEireCompetition() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-refused", null, division);
        BjjEireCompetition finished = insertBjjEireCompetition(
                "cancel-finished",
                BjjEireCompetitionStatus.FINISHED,
                OPENS_AT,
                CLOSES_AT,
                null,
                maleWhiteAdult("-76 kg"));

        assertThat(cancelBjjEireCompetition(competition.getId(), AOIFE).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(cancelBjjEireCompetition(competition.getId(), null).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(cancelBjjEireCompetition(finished.getId(), "integration-test-token")
                        .getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
        assertThat(mongoTemplate
                        .findById(competition.getId(), BjjEireCompetition.class)
                        .getStatus())
                .isEqualTo(BjjEireCompetitionStatus.PUBLISHED);
    }

    private ResponseEntity<String> cancelBjjEireCompetition(String competitionId, String token) {
        return restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competitionId + "/cancel",
                HttpMethod.POST,
                jsonEntity("", token),
                String.class);
    }
}
