package com.bjjeire.api.registration;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** What was returned for a sign-up. Embedded in {@link BjjEireCompetitionRegistration}. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Refund {
    private String refundId;
    private int amountCents;
    private RefundStatus status;
    private Instant requestedAt;
    private Instant completedAt;
    private String failureReason;

    /**
     * How many times Stripe was asked for this refund. The first ask uses the key {@code refund-<registrationId>}; a
     * retry of a refund that failed uses {@code refund-<registrationId>-<attempts>}, because Stripe answers a reused
     * key with its first answer and creates nothing. Stripe refuses to refund more than was paid, so a new key cannot
     * pay back twice.
     */
    private int attempts;
}
