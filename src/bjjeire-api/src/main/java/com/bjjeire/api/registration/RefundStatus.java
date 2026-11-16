package com.bjjeire.api.registration;

/** Whether a refund reached the competitor. {@code FAILED} is shown to them as "refund pending". */
public enum RefundStatus {
    PENDING,
    REFUNDED,
    FAILED
}
