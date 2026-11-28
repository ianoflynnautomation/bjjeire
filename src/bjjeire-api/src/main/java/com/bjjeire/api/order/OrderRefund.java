package com.bjjeire.api.order;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A full refund of an order, as asked of Stripe and as Stripe reported it (FR-022). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRefund {
    private String refundId;
    private int amountCents;
    private OrderRefundStatus status;
    private int attempts;
    private Instant requestedAt;
    private Instant completedAt;
    private String failureReason;
}
