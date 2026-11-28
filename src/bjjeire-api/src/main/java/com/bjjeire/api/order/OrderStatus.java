package com.bjjeire.api.order;

/** Where an order is in its life (data-model.md § State transitions, research R9). Wire values are UPPER_SNAKE. */
public enum OrderStatus {
    /** Its stock is held while the guest pays at Stripe. */
    AWAITING_PAYMENT,
    /** Paid; its stock is sold. */
    CONFIRMED,
    /** The organiser sent it. */
    DISPATCHED,
    /** Unpaid when its hold ended; its stock went back. */
    EXPIRED,
    /** Its payment was returned in full. */
    REFUNDED;

    /**
     * Tells whether an order in this status may move to another.
     *
     * @param target the status asked for
     * @return true for a transition in data-model.md § State transitions
     */
    public boolean canBecome(OrderStatus target) {
        return switch (this) {
            case AWAITING_PAYMENT -> target == CONFIRMED || target == EXPIRED;
            case EXPIRED -> target == CONFIRMED || target == REFUNDED;
            case CONFIRMED -> target == DISPATCHED || target == REFUNDED;
            case DISPATCHED -> target == REFUNDED;
            case REFUNDED -> false;
        };
    }
}
