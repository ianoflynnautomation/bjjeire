package com.bjjeire.api.order;

/** The shop's signed Stripe webhook (contracts/stripe-webhook.md). */
public interface OrderWebhookService {
    /**
     * Verifies, records and applies one event. Events for another kind of object are acknowledged and skipped.
     *
     * @param payload the raw body
     * @param signatureHeader {@code Stripe-Signature}, or null
     */
    void handle(String payload, String signatureHeader);
}
