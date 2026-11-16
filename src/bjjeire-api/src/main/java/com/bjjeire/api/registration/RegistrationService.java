package com.bjjeire.api.registration;

import com.bjjeire.api.competitor.CompetitorIdentity;
import java.util.List;

/** Use cases for signing up, paying and the lists built from sign-ups (User Story 3). */
public interface RegistrationService {
    /**
     * Starts a sign-up: checks it, takes a place, and opens a Checkout page for the tournament's fee.
     *
     * @param caller the signed-in competitor
     * @param command the tournament, the division and both consents
     * @return where to pay
     * @throws org.springframework.web.server.ResponseStatusException 404 for an unknown or draft tournament or a
     *     division it lacks; 409 {@code registration-not-open}, {@code profile-incomplete}, {@code under-18},
     *     {@code not-eligible}, {@code tournament-full}, {@code already-registered} or {@code too-many-unpaid}; 502
     *     {@code payment-unavailable}, with the place given back
     */
    RegistrationCheckoutDto create(CompetitorIdentity caller, CreateRegistrationCommand command);

    /**
     * Returns the open Checkout page of the caller's unpaid sign-up again, for a competitor who left it.
     *
     * @param caller the signed-in competitor
     * @param registrationId the sign-up
     * @return the same page and hold
     * @throws org.springframework.web.server.ResponseStatusException 404 unknown; 403 another competitor's; 409
     *     {@code hold-expired} once the hold ended or the sign-up is no longer awaiting payment
     */
    RegistrationCheckoutDto resumeCheckout(CompetitorIdentity caller, String registrationId);

    /**
     * Lists the caller's sign-ups, newest first.
     *
     * @param caller the signed-in competitor
     * @return every sign-up of the caller, empty without a profile
     */
    List<RegistrationDto> getOwn(CompetitorIdentity caller);

    /**
     * Lists the confirmed competitors of a public tournament by division.
     *
     * @param tournamentId tournament id
     * @return one entry per division in the tournament's order
     * @throws org.springframework.web.server.ResponseStatusException 404 for an unknown or draft tournament
     */
    List<DivisionCompetitorsDto> getListedCompetitors(String tournamentId);

    /**
     * Stripe reports a Checkout Session paid. Confirms the sign-up, or, when its hold had lapsed and no place is left,
     * refunds it in full (research R5). Safe to repeat.
     *
     * @param registrationId the session's {@code client_reference_id}
     * @param checkoutSessionId the session
     * @param paymentIntentId the payment, for a refund
     */
    void onCheckoutPaid(String registrationId, String checkoutSessionId, String paymentIntentId);

    /**
     * Stripe reports a Checkout Session expired unpaid. Ends the sign-up and gives its place back. Safe to repeat.
     *
     * @param registrationId the session's {@code client_reference_id}
     * @param checkoutSessionId the session
     */
    void onCheckoutExpired(String registrationId, String checkoutSessionId);

    /**
     * Ends every unpaid hold that has lapsed and gives its place back exactly once, however many instances run it.
     *
     * @return how many sign-ups were expired by this call
     */
    int expireLapsedHolds();
}
