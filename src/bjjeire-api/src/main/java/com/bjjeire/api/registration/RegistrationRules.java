package com.bjjeire.api.registration;

import java.time.Duration;
import java.time.Instant;

/** The sign-up rules that need no database. */
final class RegistrationRules {
    /** Stripe does not let a Checkout Session expire sooner (research R4). */
    static final Duration DEFAULT_HOLD = Duration.ofMinutes(30);

    /**
     * Added to the hold for the Checkout Session's own expiry. Stripe measures its 30-minute minimum from when it
     * creates the session, a moment after the hold starts. A payment completed in the margin arrives as a late payment.
     */
    static final Duration CHECKOUT_EXPIRY_MARGIN = Duration.ofMinutes(2);

    /** A competitor may hold at most this many unpaid sign-ups in one competition (FR-041). */
    static final int MAX_UNPAID_PER_COMPETITION = 2;

    private RegistrationRules() {}

    static Instant holdExpiresAt(Instant now, Duration hold) {
        return now.plus(hold);
    }
}
