package com.bjjeire.api.order;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** An order's Stripe Checkout and what became of it. Holds no card details (FR-010). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPayment {
    private String checkoutSessionId;
    private String checkoutUrl;
    private String paymentIntentId;

    @Builder.Default
    private OrderPaymentStatus status = OrderPaymentStatus.PENDING;

    private Instant paidAt;

    /** Set once when the hold sweep found the session paid with no webhook, and raised it for the organiser. */
    private Instant unconfirmedAlertedAt;
}
