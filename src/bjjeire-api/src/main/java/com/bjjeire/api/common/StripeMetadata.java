package com.bjjeire.api.common;

/**
 * Whose a Stripe object is (ADR-0016). Stripe sends every event to every webhook endpoint subscribed to its type, under
 * one event id, so each Checkout Session and Refund carries {@link #KIND} and each webhook handles only its own.
 *
 * <p>The values are a contract with objects already in Stripe: changing one strands their events.
 */
public final class StripeMetadata {
    /** The metadata key on Checkout Sessions and Refunds. */
    public static final String KIND = "bjjeireKind";
    /** A BJJ Éire competition sign-up. Objects made before the shop have no kind and are registration's too. */
    public static final String KIND_REGISTRATION = "registration";
    /** A merch order. */
    public static final String KIND_ORDER = "order";

    private StripeMetadata() {}
}
