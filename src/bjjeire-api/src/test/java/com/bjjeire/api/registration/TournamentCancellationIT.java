package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.registration.PaymentGateway.RefundRequest;
import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Division;
import com.bjjeire.api.tournament.Gender;
import com.bjjeire.api.tournament.Tournament;
import com.bjjeire.api.tournament.TournamentStatus;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.ObjectMapper;

/** The organiser cancels a whole tournament (FR-029). */
class TournamentCancellationIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");
    private static final String NIAMH = competitorToken("niamh");

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5026")
    void shouldRefundEveryConfirmedSignUpInFullAndMailEachCompetitor() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("cancel-all", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        TournamentRegistration aoife = confirmedSignUp(AOIFE, tournament, division);
        TournamentRegistration ciaran = confirmedSignUp(CIARAN, tournament, division);
        mailer.reset();

        ResponseEntity<String> response = cancelTournament(tournament.getId(), "integration-test-token");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(response.getBody()).at("/status").asString())
                .isEqualTo("CANCELLED");
        assertThat(mongoTemplate.findById(tournament.getId(), Tournament.class).getStatus())
                .isEqualTo(TournamentStatus.CANCELLED);
        assertThat(paymentGateway.refunds())
                .extracting(RefundRequest::idempotencyKey)
                .containsExactlyInAnyOrder("refund-" + aoife.getId(), "refund-" + ciaran.getId());
        assertThat(paymentGateway.refunds())
                .allSatisfy(refund -> assertThat(refund.amountCents()).isEqualTo(2500));
        for (TournamentRegistration registration : List.of(reload(aoife), reload(ciaran))) {
            assertThat(registration.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
            assertThat(registration.getActive()).isNull();
            assertThat(registration.getCancelledBy()).isEqualTo(TournamentRegistration.CANCELLED_BY_TOURNAMENT);
            assertThat(registration.getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        }
        assertThat(placesTaken(tournament.getId())).isZero();
        List<MailMessage> sent = mailer.awaitSent(2);
        assertThat(sent)
                .extracting(MailMessage::to)
                .containsExactlyInAnyOrder(competitorEmail("aoife"), competitorEmail("ciaran"));
        assertThat(sent).allSatisfy(mail -> {
            assertThat(mail.subject()).contains("Tournament cancelled");
            assertThat(mail.body()).contains("refund of €25.00");
        });
    }

    @Test
    @Tag("#5026")
    void shouldRetryOnlyTheRefundsThatFailedWhenTheCancellationIsRunAgain() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("cancel-rerun", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(NIAMH, "Niamh", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        confirmedSignUp(AOIFE, tournament, division);
        confirmedSignUp(CIARAN, tournament, division);
        confirmedSignUp(NIAMH, tournament, division);
        paymentGateway.failRefunds(1);

        ResponseEntity<String> first = cancelTournament(tournament.getId(), "integration-test-token");
        List<TournamentRegistration> afterFirst = mongoTemplate.findAll(TournamentRegistration.class);
        ResponseEntity<String> second = cancelTournament(tournament.getId(), "integration-test-token");
        ResponseEntity<String> third = cancelTournament(tournament.getId(), "integration-test-token");

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
        assertThat(mongoTemplate.findAll(TournamentRegistration.class))
                .allSatisfy(registration ->
                        assertThat(registration.getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED));
    }

    @Test
    @Tag("#5026")
    void shouldAskStripeForANewRefundWhenOneItReportedFailedIsRetried() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("cancel-async-failure", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        TournamentRegistration confirmed = confirmedSignUp(AOIFE, tournament, division);
        paymentGateway.reportRefundsPending(true);
        cancelTournament(tournament.getId(), "integration-test-token");
        postSignedWebhook(refundEvent("evt_refund_failed_async", "refund.failed", "failed", reload(confirmed)));
        assertThat(reload(confirmed).getRefund().getStatus()).isEqualTo(RefundStatus.FAILED);
        paymentGateway.reportRefundsPending(false);

        cancelTournament(tournament.getId(), "integration-test-token");

        // Reusing the first key would only replay Stripe's first answer: the retry must create a new refund.
        assertThat(paymentGateway.refunds())
                .extracting(RefundRequest::idempotencyKey)
                .containsExactly("refund-" + confirmed.getId(), "refund-" + confirmed.getId() + "-2");
        TournamentRegistration retried = reload(confirmed);
        assertThat(retried.getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        assertThat(retried.getRefund().getAttempts()).isEqualTo(2);
    }

    @Test
    @Tag("#5026")
    void shouldAlsoRetryAFailedRefundOfASignUpCancelledBeforeTheTournament() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("cancel-own-failed", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        TournamentRegistration confirmed = confirmedSignUp(AOIFE, tournament, division);
        paymentGateway.failRefunds(1);
        cancel(AOIFE, confirmed.getId());
        assertThat(reload(confirmed).getRefund().getStatus()).isEqualTo(RefundStatus.FAILED);

        cancelTournament(tournament.getId(), "integration-test-token");

        assertThat(reload(confirmed).getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
        assertThat(reload(confirmed).getCancelledBy()).isEqualTo(TournamentRegistration.CANCELLED_BY_COMPETITOR);
    }

    @Test
    @Tag("#5026")
    void shouldAskStripeForANewRefundWhenALatePaymentRefundItReportedFailedIsRetried() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("cancel-late-refund-failed", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, tournament.getId(), division.getId());
        TournamentRegistration unpaid = onlyRegistration();
        cancelTournament(tournament.getId(), "integration-test-token");
        paymentGateway.reportRefundsPending(true);
        postSignedWebhook(checkoutEvent("evt_late_paid", "checkout.session.completed", unpaid));
        postSignedWebhook(refundEvent("evt_late_refund_failed", "refund.failed", "failed", reload(unpaid)));
        assertThat(reload(unpaid).getRefund().getStatus()).isEqualTo(RefundStatus.FAILED);
        paymentGateway.reportRefundsPending(false);

        cancelTournament(tournament.getId(), "integration-test-token");

        assertThat(paymentGateway.refunds())
                .extracting(RefundRequest::idempotencyKey)
                .containsExactly("refund-" + unpaid.getId(), "refund-" + unpaid.getId() + "-2");
        assertThat(reload(unpaid).getRefund().getStatus()).isEqualTo(RefundStatus.REFUNDED);
    }

    @Test
    @Tag("#5026")
    void shouldEndUnpaidHoldsSoALatePaymentIsRefundedNotConfirmed() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("cancel-unpaid", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, tournament.getId(), division.getId());
        TournamentRegistration unpaid = onlyRegistration();

        cancelTournament(tournament.getId(), "integration-test-token");
        assertThat(reload(unpaid).getStatus()).isEqualTo(RegistrationStatus.EXPIRED);
        assertThat(placesTaken(tournament.getId())).isZero();

        postSignedWebhook(checkoutEvent("evt_late", "checkout.session.completed", unpaid));

        TournamentRegistration late = reload(unpaid);
        assertThat(late.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(late.getRefund().getAmountCents()).isEqualTo(2500);
        assertThat(paymentGateway.refunds()).hasSize(1);
    }

    @Test
    void shouldRefuseCompetitorsAndVisitorsAndAFinishedTournament() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("cancel-refused", null, division);
        Tournament finished = insertTournament(
                "cancel-finished", TournamentStatus.FINISHED, OPENS_AT, CLOSES_AT, null, maleWhiteAdult("-76 kg"));

        assertThat(cancelTournament(tournament.getId(), AOIFE).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(cancelTournament(tournament.getId(), null).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(cancelTournament(finished.getId(), "integration-test-token").getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
        assertThat(mongoTemplate.findById(tournament.getId(), Tournament.class).getStatus())
                .isEqualTo(TournamentStatus.PUBLISHED);
    }

    private ResponseEntity<String> cancelTournament(String tournamentId, String token) {
        return restTemplate.exchange(
                ApiRoutes.TOURNAMENT + "/" + tournamentId + "/cancel",
                HttpMethod.POST,
                jsonEntity("", token),
                String.class);
    }
}
