package com.bjjeire.api.common;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.net.Webhook;
import java.time.Clock;

/**
 * Checks a {@code Stripe-Signature} header against the raw body with Stripe's SDK, inside Stripe's default five-minute
 * tolerance. Each webhook keeps its own secret, metrics and problem documents (ADR-0013, ADR-0016).
 */
public final class StripeSignature {
    private static final long TOLERANCE_SECONDS = Webhook.DEFAULT_TOLERANCE;

    private StripeSignature() {}

    /** Why a signature was refused, or {@link #VALID}. */
    public enum Outcome {
        VALID,
        MISSING,
        MISMATCH
    }

    /**
     * @param outcome the verdict
     * @param reason what Stripe's SDK said about a mismatch, for the log; empty otherwise
     */
    public record Verdict(Outcome outcome, String reason) {
        public boolean valid() {
            return outcome == Outcome.VALID;
        }
    }

    /**
     * Verifies one delivery.
     *
     * @param payload the raw body exactly as received
     * @param signatureHeader the {@code Stripe-Signature} header, or null
     * @param secret the endpoint's signing secret; the caller has checked it is configured
     * @param clock the clock the timestamp tolerance is measured against
     */
    public static Verdict verify(String payload, String signatureHeader, String secret, Clock clock) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return new Verdict(Outcome.MISSING, "");
        }
        try {
            Webhook.Signature.verifyHeader(payload, signatureHeader, secret, TOLERANCE_SECONDS, clock);
            return new Verdict(Outcome.VALID, "");
        } catch (SignatureVerificationException invalid) {
            return new Verdict(Outcome.MISMATCH, String.valueOf(invalid.getMessage()));
        }
    }
}
