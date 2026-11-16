package com.bjjeire.api.registration;

import com.bjjeire.api.tournament.DivisionDto;
import java.time.Instant;
import java.time.LocalDate;

/**
 * One of the caller's own sign-ups (#5021). Carries no competitor id and no payment provider ids.
 *
 * @param division null when the division has since been removed from the tournament
 * @param refundStatus null when no refund was made
 * @param holdExpiresAt set while awaiting payment
 * @param refundableUntil a cancellation before this instant is refunded in full (FR-027)
 */
public record RegistrationDto(
        String id,
        String tournamentId,
        String tournamentSlug,
        String tournamentName,
        LocalDate tournamentDate,
        DivisionDto division,
        RegistrationStatus status,
        int amountCents,
        String currency,
        PaymentStatus paymentStatus,
        RefundStatus refundStatus,
        Instant holdExpiresAt,
        Instant refundableUntil,
        Instant createdAt) {}
