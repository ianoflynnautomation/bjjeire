package com.bjjeire.api.registration;

import java.time.Instant;

/**
 * The payment provider, as the sign-up service needs it (contracts/stripe-webhook.md). {@link StripePaymentGateway} is
 * the real one; integration tests use a recording fake.
 */
public interface PaymentGateway {
    /**
     * Opens a hosted Checkout page for one sign-up.
     *
     * @param request what to charge and where to send the competitor afterwards
     * @return the session, whose id the webhook later names
     * @throws PaymentGatewayException when the provider cannot be reached or refuses
     */
    CheckoutSession createCheckout(CheckoutRequest request);

    /**
     * Returns a payment in full.
     *
     * @param request the payment and amount
     * @return the refund and whether the provider already reports it as succeeded
     * @throws PaymentGatewayException when the provider cannot be reached or refuses
     */
    RefundResult refund(RefundRequest request);

    /**
     * Asks the provider what became of a Checkout Session. Never confirms anything: only the signed webhook does
     * (ADR-0013). Used so a paid session is neither offered again nor expired as unpaid.
     *
     * @param checkoutSessionId the session
     * @return its state
     * @throws PaymentGatewayException when the provider cannot be reached or refuses
     */
    CheckoutStatus checkoutStatus(String checkoutSessionId);

    /** What a Checkout Session's {@code status} and {@code payment_status} mean for a sign-up. */
    enum CheckoutStatus {
        /** Still payable. */
        OPEN,
        /** Paid; the webhook confirms the sign-up. */
        PAID,
        /** Completed with a delayed payment method that has not cleared yet. */
        PROCESSING,
        /** Closed unpaid. */
        EXPIRED;

        /**
         * Reads Stripe's two fields.
         *
         * @param status {@code open}, {@code complete} or {@code expired}
         * @param paymentStatus {@code paid}, {@code unpaid} or {@code no_payment_required}
         * @return the state; an unknown or missing status reads as {@code OPEN}
         */
        public static CheckoutStatus of(String status, String paymentStatus) {
            if ("expired".equals(status)) {
                return EXPIRED;
            }
            if ("complete".equals(status)) {
                return "unpaid".equals(paymentStatus) ? PROCESSING : PAID;
            }
            return OPEN;
        }
    }

    /**
     * @param registrationId sent as {@code client_reference_id} and in the metadata
     * @param description the line item, "«competition» — «division»"
     * @param amountCents the competition's fee, never a client value
     * @param expiresAt the hold's end
     * @param idempotencyKey {@code checkout-<registrationId>-<attempt>}
     */
    record CheckoutRequest(
            String registrationId,
            String competitionId,
            String divisionId,
            String description,
            int amountCents,
            String currency,
            String customerEmail,
            Instant expiresAt,
            String successUrl,
            String cancelUrl,
            String idempotencyKey) {}

    /**
     * @param id the Checkout Session id
     * @param url the hosted page
     */
    record CheckoutSession(String id, String url) {}

    /**
     * @param paymentIntentId the payment to return
     * @param idempotencyKey {@code refund-<registrationId>}
     */
    record RefundRequest(String registrationId, String paymentIntentId, int amountCents, String idempotencyKey) {}

    /**
     * @param refundId the provider's refund id
     * @param succeeded true when already completed, false while the provider still reports it pending
     */
    record RefundResult(String refundId, boolean succeeded) {}

    /** The provider could not be reached or refused the call. Nothing was charged by it. */
    class PaymentGatewayException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        public PaymentGatewayException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
