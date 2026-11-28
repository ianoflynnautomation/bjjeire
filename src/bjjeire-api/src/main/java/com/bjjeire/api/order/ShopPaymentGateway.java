package com.bjjeire.api.order;

import java.time.Instant;
import java.util.List;

/**
 * The payment provider, as the shop needs it (research R1, contracts/stripe-webhook.md).
 * {@link StripeShopPaymentGateway} is the real one; integration tests use a recording fake.
 */
public interface ShopPaymentGateway {
    /**
     * Opens a hosted Checkout page for one order.
     *
     * @throws PaymentGatewayException when the provider cannot be reached or refuses
     */
    CheckoutSession createCheckout(ShopCheckoutRequest request);

    /**
     * Returns an order's payment in full.
     *
     * @throws PaymentGatewayException when the provider cannot be reached or refuses
     */
    RefundResult refund(ShopRefundRequest request);

    /**
     * Asks the provider what became of a Checkout Session. Never confirms anything: only the signed webhook does.
     *
     * @throws PaymentGatewayException when the provider cannot be reached or refuses
     */
    CheckoutStatus checkoutStatus(String checkoutSessionId);

    /** What a Checkout Session's {@code status} and {@code payment_status} mean for an order. */
    enum CheckoutStatus {
        /** Still payable. */
        OPEN,
        /** Paid; the webhook confirms the order. */
        PAID,
        /** Completed with a delayed payment method that has not cleared yet. */
        PROCESSING,
        /** Closed unpaid. */
        EXPIRED;

        /**
         * Reads Stripe's two fields.
         *
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
     * One line on the Checkout page, at the shop's own price (never a client value).
     *
     * @param name "«product» — «size»"
     */
    record ShopLineItem(String name, int unitAmountCents, int quantity) {}

    /**
     * @param orderId sent as {@code client_reference_id} and in the metadata
     * @param number the order number, shown on the payment
     * @param deliveryCents the flat delivery fee, a line of its own when above 0
     * @param address passed to Stripe as the payment's shipping address
     * @param expiresAt the hold's end plus the Checkout margin
     * @param idempotencyKey {@code order-checkout-<orderId>-1}
     */
    record ShopCheckoutRequest(
            String orderId,
            String number,
            List<ShopLineItem> lines,
            int deliveryCents,
            String currency,
            String customerEmail,
            DeliveryAddressDto address,
            Instant expiresAt,
            String successUrl,
            String cancelUrl,
            String idempotencyKey) {}

    /** @param id the Checkout Session id; @param url the hosted page */
    record CheckoutSession(String id, String url) {}

    /** @param idempotencyKey {@code order-refund-<orderId>-<attempt>} */
    record ShopRefundRequest(String orderId, String paymentIntentId, int amountCents, String idempotencyKey) {}

    /** @param succeeded true when already completed, false while the provider reports it pending */
    record RefundResult(String refundId, boolean succeeded) {}

    /** The provider could not be reached or refused the call. Nothing was charged by it. */
    class PaymentGatewayException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        public PaymentGatewayException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
