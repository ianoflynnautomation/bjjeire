package com.bjjeire.api.registration;

/** Handles the Stripe webhook (contracts/stripe-webhook.md). */
public interface StripeWebhookService {
    /**
     * Verifies, records and applies one Stripe event.
     *
     * @param payload the raw request body, exactly as signed
     * @param signatureHeader the {@code Stripe-Signature} header
     * @throws org.springframework.web.server.ResponseStatusException 400 for a missing or bad signature or an
     *     unreadable body; any other failure propagates, so the webhook answers 5xx and Stripe retries
     */
    void handle(String payload, String signatureHeader);
}
