package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/** The sign-up state machine in data-model.md § TournamentRegistration. */
class RegistrationStatusTest {
    @Test
    void shouldAllowOnlyTheTransitionsTheDataModelDraws() {
        assertThat(allowedFrom(RegistrationStatus.AWAITING_PAYMENT))
                .containsExactlyInAnyOrder(RegistrationStatus.CONFIRMED, RegistrationStatus.EXPIRED);
        assertThat(allowedFrom(RegistrationStatus.CONFIRMED)).containsExactly(RegistrationStatus.CANCELLED);
        // A payment that lands after the hold lapsed is confirmed when a place is free, otherwise refunded (R5).
        assertThat(allowedFrom(RegistrationStatus.EXPIRED))
                .containsExactlyInAnyOrder(RegistrationStatus.CONFIRMED, RegistrationStatus.CANCELLED);
        assertThat(allowedFrom(RegistrationStatus.CANCELLED)).isEmpty();
    }

    @ParameterizedTest
    @EnumSource(RegistrationStatus.class)
    void shouldBeActiveExactlyWhileAwaitingPaymentOrConfirmed(RegistrationStatus status) {
        boolean expected = status == RegistrationStatus.AWAITING_PAYMENT || status == RegistrationStatus.CONFIRMED;

        assertThat(status.isActive()).isEqualTo(expected);
        // Stored as true or not at all, so the partial unique index sees only active sign-ups.
        assertThat(status.activeFlag()).isEqualTo(expected ? Boolean.TRUE : null);
    }

    @Test
    void shouldHoldAPlaceForThirtyMinutes() {
        Instant now = Instant.parse("2026-05-31T10:00:00Z");

        assertThat(RegistrationRules.holdExpiresAt(now, Duration.ofMinutes(30)))
                .isEqualTo(Instant.parse("2026-05-31T10:30:00Z"));
        assertThat(RegistrationRules.DEFAULT_HOLD).isEqualTo(Duration.ofMinutes(30));
    }

    private static Set<RegistrationStatus> allowedFrom(RegistrationStatus from) {
        Set<RegistrationStatus> allowed = EnumSet.noneOf(RegistrationStatus.class);
        for (RegistrationStatus to : RegistrationStatus.values()) {
            if (from.canBecome(to)) {
                allowed.add(to);
            }
        }
        return allowed;
    }
}
