package com.bjjeire.api.registration;

import com.bjjeire.api.competitor.CompetitorIdentity;
import com.bjjeire.api.tournament.TournamentDto;

/** Cancelling sign-ups and the refunds that follow (User Story 4). */
public interface CancellationService {
    /**
     * The competitor cancels their own confirmed sign-up: refunded in full before registration closes, not after
     * (FR-026, FR-027). Cancelling a cancelled sign-up again changes nothing and returns the same outcome.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 unknown; 403 another competitor's; 409 when it
     *     is not confirmed
     */
    CancellationDto cancelOwn(CompetitorIdentity caller, String registrationId);

    /**
     * The organiser cancels one sign-up, refunding it or not, at any time (FR-007).
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 when the sign-up is not in this tournament;
     *     409 when it is not confirmed
     */
    CancellationDto cancelByAdmin(String tournamentId, String registrationId, boolean refund);

    /**
     * Cancels the tournament, ends its unpaid holds and refunds every confirmed sign-up in full, mailing each
     * competitor (FR-029). Safe to call again: it retries only refunds that failed or never reached Stripe.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 unknown; 409 finished
     */
    TournamentDto cancelTournament(String tournamentId);

    /**
     * Stripe reports a refund's state. {@code succeeded} completes it and mails the competitor; {@code failed} or
     * {@code canceled} records the failure and alerts the organiser. Safe to repeat.
     *
     * @param registrationId from the refund's metadata
     * @param refundId Stripe's refund id; an event for another refund of the same sign-up is ignored
     * @param status Stripe's refund status
     * @param failureReason Stripe's reason, when it failed
     */
    void onRefundUpdated(String registrationId, String refundId, String status, String failureReason);
}
