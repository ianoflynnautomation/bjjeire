package com.bjjeire.api.registration;

import static com.bjjeire.api.testsupport.RetiredNames.OLD_NAME;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** A competitor cancels their own confirmed sign-up (User Story 4, FR-026, FR-027). */
class CancellationIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5022")
    void shouldRefundTheFullFeeReleaseThePlaceAndRemoveTheCompetitorFromTheListWhenRegistrationIsOpen() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-open", 10, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, division);
        assertThat(listedNames(competition)).containsExactly("Aoife Byrne");
        mailer.reset();
        paymentGateway.reportRefundsPending(true);

        ResponseEntity<String> response = cancel(AOIFE, confirmed.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/refunded").asBoolean()).isTrue();
        assertThat(body.at("/refundAmountCents").asInt()).isEqualTo(2500);
        assertThat(body.at("/refundStatus").asString()).isEqualTo("PENDING");

        List<RefundRequest> refunds = paymentGateway.refunds();
        assertThat(refunds).hasSize(1);
        assertThat(refunds.getFirst().amountCents()).isEqualTo(2500);
        assertThat(refunds.getFirst().paymentIntentId()).isEqualTo("pi_test_" + confirmed.getId());
        assertThat(refunds.getFirst().idempotencyKey()).isEqualTo("refund-" + confirmed.getId());

        BjjEireCompetitionRegistration cancelled = reload(confirmed);
        assertThat(cancelled.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(cancelled.getActive()).isNull();
        assertThat(cancelled.getCancelledAt()).isEqualTo(FIXED_NOW);
        assertThat(cancelled.getCancelledBy()).isEqualTo(BjjEireCompetitionRegistration.CANCELLED_BY_COMPETITOR);
        assertThat(cancelled.getRefund().getStatus()).isEqualTo(RefundStatus.PENDING);
        assertThat(cancelled.getRefund().getAmountCents()).isEqualTo(2500);
        assertThat(cancelled.getRefund().getRefundId()).startsWith("re_test_");
        assertThat(cancelled.getPayment().getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(placesTaken(competition.getId())).isZero();
        assertThat(listedNames(competition)).isEmpty();
    }

    @Test
    @Tag("#5022")
    void shouldRecordTheRefundAsDoneWhenStripeReportsItSucceededAtOnce() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-instant", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, division);

        ResponseEntity<String> response = cancel(AOIFE, confirmed.getId());

        assertThat(objectMapper.readTree(response.getBody()).at("/refundStatus").asString())
                .isEqualTo("REFUNDED");
        assertThat(reload(confirmed).getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        assertThat(reload(confirmed).getRefund().getCompletedAt()).isEqualTo(FIXED_NOW);
    }

    @Test
    @Tag("#5023")
    void shouldCancelWithoutARefundOnceRegistrationHasClosed() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-closed", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, division);
        closeRegistration(competition.getId());

        ResponseEntity<String> response = cancel(AOIFE, confirmed.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/refunded").asBoolean()).isFalse();
        assertThat(body.at("/refundAmountCents").asInt()).isZero();
        assertThat(body.at("/refundStatus").isMissingNode()).isTrue();
        assertThat(paymentGateway.refunds()).isEmpty();
        BjjEireCompetitionRegistration cancelled = reload(confirmed);
        assertThat(cancelled.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(cancelled.getRefund()).isNull();
        assertThat(placesTaken(competition.getId())).isZero();
        assertThat(listedNames(competition)).isEmpty();
    }

    @Test
    @Tag("#5023")
    void shouldTellTheCompetitorUntilWhenACancellationIsRefunded() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("refundable-until", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        confirmedSignUp(AOIFE, competition, division);

        ResponseEntity<String> own = restTemplate.exchange(
                ApiRoutes.REGISTRATION + "/me", HttpMethod.GET, jsonEntity("", AOIFE), String.class);

        assertThat(objectMapper.readTree(own.getBody()).at("/0/refundableUntil").asString())
                .isEqualTo(CLOSES_AT.toString());
    }

    @Test
    @Tag("#5027")
    void shouldSendOneMailStatingTheRefundOutcome() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition open = publishedBjjEireCompetition("mail-refund", null, division);
        Division closedDivision = maleWhiteAdult("-82 kg");
        BjjEireCompetition closed = publishedBjjEireCompetition("mail-no-refund", null, closedDivision);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration refundable = confirmedSignUp(AOIFE, open, division);
        BjjEireCompetitionRegistration notRefundable = confirmedSignUp(AOIFE, closed, closedDivision);
        closeRegistration(closed.getId());
        mailer.reset();

        cancel(AOIFE, refundable.getId());
        List<MailMessage> first = mailer.awaitSent(1);
        cancel(AOIFE, notRefundable.getId());
        List<MailMessage> both = mailer.awaitSent(2);

        assertThat(first).hasSize(1);
        assertThat(both).hasSize(2);
        MailMessage refundMail = both.get(0);
        assertThat(refundMail.to()).isEqualTo(competitorEmail("aoife"));
        assertThat(refundMail.subject()).contains("cancelled");
        assertThat(refundMail.body()).contains("BjjEire mail-refund").contains("refund of €25.00");
        MailMessage noRefundMail = both.get(1);
        assertThat(noRefundMail.subject()).contains("cancelled");
        assertThat(noRefundMail.body()).contains("BjjEire mail-no-refund").contains("No refund");
        assertThat(both).allSatisfy(mail -> {
            assertThat(mail.subject()).doesNotContainIgnoringCase(OLD_NAME);
            assertThat(mail.body()).doesNotContainIgnoringCase(OLD_NAME);
        });
    }

    @Test
    @Tag("#5022")
    void shouldChangeNothingWhenTheSameSignUpIsCancelledTwice() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-twice", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, division);
        mailer.reset();

        ResponseEntity<String> first = cancel(AOIFE, confirmed.getId());
        mailer.awaitSent(1);
        ResponseEntity<String> again = cancel(AOIFE, confirmed.getId());

        assertThat(again.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(again.getBody())).isEqualTo(objectMapper.readTree(first.getBody()));
        assertThat(paymentGateway.refunds()).hasSize(1);
        assertThat(placesTaken(competition.getId())).isZero();
        assertThat(mailer.awaitSent(2)).hasSize(1);
    }

    @Test
    @Tag("#5022")
    void shouldKeepTheCancellationAndShowTheRefundAsPendingWhenStripeRefusesIt() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("refund-refused", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, division);
        paymentGateway.failNextRefunds(true);

        ResponseEntity<String> response = cancel(AOIFE, confirmed.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(response.getBody()).at("/refundStatus").asString())
                .isEqualTo("FAILED");
        BjjEireCompetitionRegistration cancelled = reload(confirmed);
        assertThat(cancelled.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(cancelled.getRefund().getStatus()).isEqualTo(RefundStatus.FAILED);
        assertThat(cancelled.getRefund().getFailureReason()).contains("refused");
        assertThat(placesTaken(competition.getId())).isZero();
    }

    @Test
    @Tag("#5022")
    void shouldRecordTheRefundAsFailedAndAlertWhenNoPaymentIdWasRecorded() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("refund-no-intent", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, division);
        mongoTemplate.updateFirst(
                org.springframework.data.mongodb.core.query.Query.query(
                        org.springframework.data.mongodb.core.query.Criteria.where("_id")
                                .is(confirmed.getId())),
                new org.springframework.data.mongodb.core.query.Update().unset("payment.paymentIntentId"),
                BjjEireCompetitionRegistration.class);
        mailer.reset();

        ResponseEntity<String> response = cancel(AOIFE, confirmed.getId());

        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/refunded").asBoolean()).isTrue();
        assertThat(body.at("/refundStatus").asString()).isEqualTo("FAILED");
        assertThat(paymentGateway.refunds()).isEmpty();
        assertThat(reload(confirmed).getRefund().getStatus()).isEqualTo(RefundStatus.FAILED);
        assertThat(mailer.awaitSent(1).getFirst().body()).contains("could not be completed automatically");
    }

    @Test
    void shouldRefuseToCancelAnotherCompetitorsSignUp() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-other", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, division);

        ResponseEntity<String> response = cancel(CIARAN, confirmed.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(reload(confirmed).getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
        assertThat(paymentGateway.refunds()).isEmpty();
    }

    @Test
    void shouldRefuseToCancelAnUnpaidSignUpWhichEndsWithItsHold() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("cancel-unpaid", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());

        ResponseEntity<String> response = cancel(AOIFE, onlyRegistration().getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(objectMapper.readTree(response.getBody()).at("/type").asString())
                .isEqualTo("urn:bjjeire:conflict");
        assertThat(onlyRegistration().getStatus()).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);
    }

    private List<String> listedNames(BjjEireCompetition competition) {
        ResponseEntity<String> listed = restTemplate.getForEntity(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competition.getId() + "/competitor", String.class);
        JsonNode divisions = objectMapper.readTree(listed.getBody());
        java.util.ArrayList<String> names = new java.util.ArrayList<>();
        divisions.forEach(division -> division.at("/competitors")
                .forEach(competitor -> names.add(competitor.at("/displayName").asString())));
        return names;
    }
}
