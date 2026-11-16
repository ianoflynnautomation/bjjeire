package com.bjjeire.api.registration;

import java.util.Set;

/** Where a sign-up is in its life (data-model.md § TournamentRegistration, state transitions). */
public enum RegistrationStatus {
    AWAITING_PAYMENT,
    CONFIRMED,
    CANCELLED,
    EXPIRED;

    /** Statuses that hold a place and count against the one-per-division rule (FR-020). */
    public static final Set<RegistrationStatus> ACTIVE = Set.of(AWAITING_PAYMENT, CONFIRMED);

    /**
     * Tells whether a sign-up may move to another status.
     *
     * @param next the status asked about
     * @return true for the transitions the data model draws. {@code EXPIRED} may still become {@code CONFIRMED} or
     *     {@code CANCELLED} when Stripe reports a payment after the hold lapsed (research R5)
     */
    public boolean canBecome(RegistrationStatus next) {
        return switch (this) {
            case AWAITING_PAYMENT -> next == CONFIRMED || next == EXPIRED;
            case CONFIRMED -> next == CANCELLED;
            case EXPIRED -> next == CONFIRMED || next == CANCELLED;
            case CANCELLED -> false;
        };
    }

    /** Whether this status holds a place. */
    public boolean isActive() {
        return ACTIVE.contains(this);
    }

    /**
     * The stored {@code active} field: {@code true}, or absent so the partial unique index ignores the sign-up.
     *
     * @return {@code Boolean.TRUE} or null
     */
    public Boolean activeFlag() {
        return isActive() ? Boolean.TRUE : null;
    }
}
