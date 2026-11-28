package com.bjjeire.api.order;

/** An order's refund: asked of Stripe, completed, or failed and left to the organiser (#6021). */
public enum OrderRefundStatus {
    PENDING,
    REFUNDED,
    FAILED
}
