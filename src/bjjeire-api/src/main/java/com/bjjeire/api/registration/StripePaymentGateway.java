package com.bjjeire.api.registration;

import com.bjjeire.api.common.StripeMetadata;
import com.bjjeire.api.common.StripeSecrets;
import com.bjjeire.api.config.BjjEireProperties;
import com.stripe.StripeClient;
import com.stripe.exception.InvalidRequestException;
import com.stripe.exception.StripeException;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import java.util.Locale;
import org.springframework.stereotype.Component;

/** Stripe hosted Checkout and Refunds through the official SDK (ADR-0013, contracts/stripe-webhook.md). */
@Component
public class StripePaymentGateway implements PaymentGateway {
    private final StripeClient client;
    private final boolean configured;

    public StripePaymentGateway(BjjEireProperties properties) {
        String key = properties.stripe().secretKey();
        this.configured = StripeSecrets.isConfigured(key);
        this.client = new StripeClient(configured ? key : "sk_unconfigured");
    }

    @Override
    public CheckoutSession createCheckout(CheckoutRequest request) {
        requireConfigured();
        SessionCreateParams params = checkoutParams(request);
        try {
            Session session = client.v1().checkout().sessions().create(params, idempotent(request.idempotencyKey()));
            return new CheckoutSession(session.getId(), session.getUrl());
        } catch (StripeException failed) {
            throw new PaymentGatewayException("Stripe refused the Checkout Session: " + failed.getMessage(), failed);
        }
    }

    @Override
    public CheckoutStatus checkoutStatus(String checkoutSessionId) {
        requireConfigured();
        try {
            Session session = client.v1().checkout().sessions().retrieve(checkoutSessionId);
            return CheckoutStatus.of(session.getStatus(), session.getPaymentStatus());
        } catch (StripeException failed) {
            return statusWhenRetrieveFails(failed);
        }
    }

    /**
     * Tells a session Stripe does not know, which can never be paid again (another key or sandbox, or test to live),
     * from a failure to ask.
     *
     * @return {@code EXPIRED} for {@code resource_missing}
     * @throws PaymentGatewayException for anything else: the state is unknown
     */
    static CheckoutStatus statusWhenRetrieveFails(StripeException failed) {
        if (failed instanceof InvalidRequestException invalid
                && ("resource_missing".equals(invalid.getCode())
                        || Integer.valueOf(404).equals(invalid.getStatusCode()))) {
            return CheckoutStatus.EXPIRED;
        }
        throw new PaymentGatewayException(
                "Stripe could not report the Checkout Session: " + failed.getMessage(), failed);
    }

    @Override
    public RefundResult refund(RefundRequest request) {
        requireConfigured();
        RefundCreateParams params = refundParams(request);
        try {
            Refund refund = client.v1().refunds().create(params, idempotent(request.idempotencyKey()));
            return new RefundResult(refund.getId(), "succeeded".equals(refund.getStatus()));
        } catch (StripeException failed) {
            throw new PaymentGatewayException("Stripe refused the refund: " + failed.getMessage(), failed);
        }
    }

    private void requireConfigured() {
        if (!configured) {
            throw new PaymentGatewayException(
                    "Stripe is not configured: STRIPE_SECRET_KEY is blank or a placeholder", null);
        }
    }

    private static RequestOptions idempotent(String key) {
        return RequestOptions.builder().setIdempotencyKey(key).build();
    }

    /** The session for one sign-up. Marked as registration's, so the shop's webhook leaves its events alone. */
    static SessionCreateParams checkoutParams(CheckoutRequest request) {
        return SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setClientReferenceId(request.registrationId())
                .putMetadata(StripeMetadata.KIND, StripeMetadata.KIND_REGISTRATION)
                .putMetadata("registrationId", request.registrationId())
                .putMetadata("competitionId", request.competitionId())
                .putMetadata("divisionId", request.divisionId())
                .setCustomerEmail(request.customerEmail())
                .setExpiresAt(request.expiresAt().getEpochSecond())
                .setSuccessUrl(request.successUrl())
                .setCancelUrl(request.cancelUrl())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(request.currency().toLowerCase(Locale.ROOT))
                                .setUnitAmount((long) request.amountCents())
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(request.description())
                                        .build())
                                .build())
                        .build())
                .build();
    }

    /** The refund of one sign-up, marked as registration's like its session. */
    static RefundCreateParams refundParams(RefundRequest request) {
        return RefundCreateParams.builder()
                .setPaymentIntent(request.paymentIntentId())
                .setAmount((long) request.amountCents())
                .putMetadata(StripeMetadata.KIND, StripeMetadata.KIND_REGISTRATION)
                .putMetadata("registrationId", request.registrationId())
                .build();
    }
}
