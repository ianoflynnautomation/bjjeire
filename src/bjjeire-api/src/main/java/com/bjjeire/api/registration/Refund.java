package com.bjjeire.api.registration;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** What was returned for a sign-up. Embedded in {@link TournamentRegistration}. */
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
}
