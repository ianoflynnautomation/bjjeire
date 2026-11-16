package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Division;
import com.bjjeire.api.tournament.Gender;
import com.bjjeire.api.tournament.Tournament;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

/** The fallback that ends unpaid holds when Stripe's expiry event never arrives (FR-019, research R4). */
class HoldSweepIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");
    private static final String NIAMH = competitorToken("niamh");

    @Autowired
    private HoldSweep holdSweep;

    @Autowired
    private io.micrometer.core.instrument.MeterRegistry meterRegistry;

    @Test
    void shouldExpireALapsedHoldAndReleaseItsPlaceExactlyOnceWhenSweptTwice() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("sweep", 5, division);
        TournamentRegistration lapsed = signUpAs(AOIFE, "Aoife", tournament, division);
        lapse(lapsed);

        holdSweep.sweep();
        holdSweep.sweep();

        TournamentRegistration expired = mongoTemplate.findById(lapsed.getId(), TournamentRegistration.class);
        assertThat(expired.getStatus()).isEqualTo(RegistrationStatus.EXPIRED);
        assertThat(expired.getActive()).isNull();
        assertThat(placesTaken(tournament.getId())).isZero();
    }

    @Test
    void shouldReleaseThePlaceOnceWhenTwoInstancesSweepAtTheSameTime() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("sweep-race", 5, division);
        lapse(signUpAs(AOIFE, "Aoife", tournament, division));
        lapse(signUpAs(CIARAN, "Ciaran", tournament, division));

        CompletableFuture.allOf(
                        CompletableFuture.runAsync(holdSweep::sweep),
                        CompletableFuture.runAsync(holdSweep::sweep),
                        CompletableFuture.runAsync(holdSweep::sweep))
                .join();

        assertThat(placesTaken(tournament.getId())).isZero();
        assertThat(mongoTemplate.findAll(TournamentRegistration.class))
                .allSatisfy(registration -> assertThat(registration.getStatus()).isEqualTo(RegistrationStatus.EXPIRED));
    }

    @Test
    void shouldLeaveConfirmedSignUpsAndUnexpiredHoldsAlone() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("sweep-keep", 5, division);
        TournamentRegistration confirmed = signUpAs(AOIFE, "Aoife", tournament, division);
        postSignedWebhook(checkoutEvent("evt_keep", "checkout.session.completed", confirmed));
        TournamentRegistration holding = signUpAs(CIARAN, "Ciaran", tournament, division);
        TournamentRegistration lapsed = signUpAs(NIAMH, "Niamh", tournament, division);
        lapse(lapsed);

        holdSweep.sweep();

        assertThat(status(confirmed)).isEqualTo(RegistrationStatus.CONFIRMED);
        assertThat(status(holding)).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);
        assertThat(status(lapsed)).isEqualTo(RegistrationStatus.EXPIRED);
        assertThat(placesTaken(tournament.getId())).isEqualTo(2);
    }

    @Test
    @Tag("#5015")
    void shouldNeverExpireAHoldWhoseCheckoutStripeReportsPaidAndRaiseOneAlert() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("sweep-paid", 5, division);
        TournamentRegistration paid = signUpAs(AOIFE, "Aoife", tournament, division);
        lapse(paid);
        paymentGateway.setCheckoutStatus(paid.getPayment().getCheckoutSessionId(), PaymentGateway.CheckoutStatus.PAID);
        double alertsBefore = meterRegistry
                .counter(RegistrationServiceImpl.UNCONFIRMED_PAYMENT_METRIC)
                .count();

        holdSweep.sweep();
        holdSweep.sweep();

        TournamentRegistration kept = mongoTemplate.findById(paid.getId(), TournamentRegistration.class);
        assertThat(kept.getStatus()).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);
        assertThat(kept.getPayment().getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(kept.getPayment().getUnconfirmedAlertedAt()).isEqualTo(FIXED_NOW);
        assertThat(placesTaken(tournament.getId())).isEqualTo(1);
        assertThat(meterRegistry
                                .counter(RegistrationServiceImpl.UNCONFIRMED_PAYMENT_METRIC)
                                .count()
                        - alertsBefore)
                .isEqualTo(1.0);

        // The webhook still confirms it when it finally arrives.
        postSignedWebhook(checkoutEvent("evt_sweep_paid", "checkout.session.completed", kept));
        assertThat(status(paid)).isEqualTo(RegistrationStatus.CONFIRMED);
    }

    @Test
    void shouldWaitForTheCheckoutToCloseBeforeExpiringAHold() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("sweep-margin", 5, division);
        TournamentRegistration justLapsed = signUpAs(AOIFE, "Aoife", tournament, division);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(justLapsed.getId())),
                Update.update("holdExpiresAt", FIXED_NOW.minus(Duration.ofMinutes(1))),
                TournamentRegistration.class);

        holdSweep.sweep();

        assertThat(status(justLapsed)).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);
        assertThat(paymentGateway.statusLookups()).isZero();
    }

    @Test
    void shouldLeaveAHoldForTheNextSweepWhenStripeCannotBeAsked() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("sweep-unknown", 5, division);
        TournamentRegistration lapsed = signUpAs(AOIFE, "Aoife", tournament, division);
        lapse(lapsed);
        paymentGateway.failStatusLookups(true);

        holdSweep.sweep();

        assertThat(status(lapsed)).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);
        assertThat(placesTaken(tournament.getId())).isEqualTo(1);
    }

    @Test
    @Tag("#5016")
    void shouldReleaseAHoldWhoseSessionStripeNoLongerKnowsSoTheCompetitorCanSignUpAgain() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("sweep-gone", 5, division);
        TournamentRegistration orphan = signUpAs(AOIFE, "Aoife", tournament, division);
        lapse(orphan);
        // What StripePaymentGateway answers for resource_missing.
        paymentGateway.setCheckoutStatus(
                orphan.getPayment().getCheckoutSessionId(), PaymentGateway.CheckoutStatus.EXPIRED);

        holdSweep.sweep();

        assertThat(status(orphan)).isEqualTo(RegistrationStatus.EXPIRED);
        assertThat(placesTaken(tournament.getId())).isZero();
        assertThat(signUp(AOIFE, tournament.getId(), division.getId()).getStatusCode())
                .isEqualTo(org.springframework.http.HttpStatus.CREATED);
    }

    @Test
    void shouldAlertOnceAndStopAskingWhenStripeCannotReportAHoldForADay() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("sweep-unknown-day", 5, division);
        TournamentRegistration stuck = signUpAs(AOIFE, "Aoife", tournament, division);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(stuck.getId())),
                Update.update("holdExpiresAt", FIXED_NOW.minus(Duration.ofHours(25))),
                TournamentRegistration.class);
        paymentGateway.failStatusLookups(true);
        double alertsBefore = meterRegistry
                .counter(RegistrationServiceImpl.UNCONFIRMED_PAYMENT_METRIC)
                .count();

        holdSweep.sweep();
        int lookupsAfterFirst = paymentGateway.statusLookups();
        holdSweep.sweep();

        TournamentRegistration kept = mongoTemplate.findById(stuck.getId(), TournamentRegistration.class);
        // It may have been paid: never expired blind. The organiser resolves it.
        assertThat(kept.getStatus()).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);
        assertThat(kept.getPayment().getUnconfirmedAlertedAt()).isEqualTo(FIXED_NOW);
        assertThat(meterRegistry
                                .counter(RegistrationServiceImpl.UNCONFIRMED_PAYMENT_METRIC)
                                .count()
                        - alertsBefore)
                .isEqualTo(1.0);
        // Out of later batches, so it cannot crowd out other lapsed holds.
        assertThat(paymentGateway.statusLookups()).isEqualTo(lookupsAfterFirst);
    }

    private TournamentRegistration signUpAs(String token, String name, Tournament tournament, Division division) {
        saveProfile(token, name, Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        String body = signUp(token, tournament.getId(), division.getId()).getBody();
        String id = body.replaceAll("(?s).*\"registrationId\"\\s*:\\s*\"([0-9a-f]{24})\".*", "$1");
        return mongoTemplate.findById(id, TournamentRegistration.class);
    }

    private void lapse(TournamentRegistration registration) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getId())),
                // Past the hold and the 2-minute Checkout margin: Stripe has closed the session too.
                Update.update("holdExpiresAt", FIXED_NOW.minus(Duration.ofMinutes(5))),
                TournamentRegistration.class);
    }

    private RegistrationStatus status(TournamentRegistration registration) {
        return mongoTemplate
                .findById(registration.getId(), TournamentRegistration.class)
                .getStatus();
    }
}
