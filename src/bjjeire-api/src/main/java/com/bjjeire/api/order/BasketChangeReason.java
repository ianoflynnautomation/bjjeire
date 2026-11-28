package com.bjjeire.api.order;

/** Why a basket line can no longer be bought as the shopper saw it (#6010). */
public enum BasketChangeReason {
    /** Fewer are available than the line asks for; {@code nowAvailable} says how many. */
    SOLD_OUT,
    /** The price changed; {@code nowPriceCents} is the new one. */
    PRICE_CHANGED,
    /** The product is hidden, deleted or no longer comes in that size. */
    UNAVAILABLE
}
