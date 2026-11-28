package com.bjjeire.api.order;

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

/**
 * Stripe hosted Checkout and Refunds for the shop (research R1, R3). Every session, payment and refund carries
 * {@code bjjeireKind = order}, so registration's webhook leaves its events alone (ADR-0016).
 */
@Component
public class StripeShopPaymentGateway implements ShopPaymentGateway {
    static final String DELIVERY_LINE = "Delivery (Ireland and Northern Ireland)";

    private final StripeClient client;
    private final boolean configured;

    public StripeShopPaymentGateway(BjjEireProperties properties) {
        String key = properties.stripe().secretKey();
        this.configured = StripeSecrets.isConfigured(key);
        this.client = new StripeClient(configured ? key : "sk_unconfigured");
    }

    @Override
    public CheckoutSession createCheckout(ShopCheckoutRequest request) {
        requireConfigured();
        try {
            Session session = client.v1()
                    .checkout()
                    .sessions()
                    .create(checkoutParams(request), idempotent(request.idempotencyKey()));
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
     * Tells a session Stripe does not know, which can never be paid, from a failure to ask.
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
    public RefundResult refund(ShopRefundRequest request) {
        requireConfigured();
        try {
            Refund refund = client.v1().refunds().create(refundParams(request), idempotent(request.idempotencyKey()));
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

    /**
     * One session per order: a line per order line at the shop's price, and one for delivery. The address the API
     * checked goes to Stripe as the shipping address; Stripe's own address collection is not used, because it cannot
     * tell Northern Ireland from the rest of GB (research R3).
     */
    static SessionCreateParams checkoutParams(ShopCheckoutRequest request) {
        String currency = request.currency().toLowerCase(Locale.ROOT);
        DeliveryAddressDto address = request.address();
        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setClientReferenceId(request.orderId())
                .putMetadata(StripeMetadata.KIND, StripeMetadata.KIND_ORDER)
                .putMetadata("orderId", request.orderId())
                .setCustomerEmail(request.customerEmail())
                .setExpiresAt(request.expiresAt().getEpochSecond())
                .setSuccessUrl(request.successUrl())
                .setCancelUrl(request.cancelUrl())
                .setPaymentIntentData(SessionCreateParams.PaymentIntentData.builder()
                        .setDescription("BJJ Éire order " + request.number())
                        .putMetadata(StripeMetadata.KIND, StripeMetadata.KIND_ORDER)
                        .putMetadata("orderId", request.orderId())
                        .setShipping(SessionCreateParams.PaymentIntentData.Shipping.builder()
                                .setName(address.name())
                                .setPhone(address.phone())
                                .setAddress(SessionCreateParams.PaymentIntentData.Shipping.Address.builder()
                                        .setLine1(address.line1())
                                        .setLine2(address.line2())
                                        .setCity(address.town())
                                        .setState(address.county())
                                        .setPostalCode(address.postcode())
                                        .setCountry(address.country().toUpperCase(Locale.ROOT))
                                        .build())
                                .build())
                        .build());
        for (ShopLineItem line : request.lines()) {
            builder.addLineItem(lineItem(line.name(), line.unitAmountCents(), line.quantity(), currency));
        }
        if (request.deliveryCents() > 0) {
            builder.addLineItem(lineItem(DELIVERY_LINE, request.deliveryCents(), 1, currency));
        }
        return builder.build();
    }

    /** The refund of one order, marked as the shop's like its session. */
    static RefundCreateParams refundParams(ShopRefundRequest request) {
        return RefundCreateParams.builder()
                .setPaymentIntent(request.paymentIntentId())
                .setAmount((long) request.amountCents())
                .putMetadata(StripeMetadata.KIND, StripeMetadata.KIND_ORDER)
                .putMetadata("orderId", request.orderId())
                .build();
    }

    private static SessionCreateParams.LineItem lineItem(
            String name, int unitAmountCents, int quantity, String currency) {
        return SessionCreateParams.LineItem.builder()
                .setQuantity((long) quantity)
                .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency(currency)
                        .setUnitAmount((long) unitAmountCents)
                        .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                .setName(name)
                                .build())
                        .build())
                .build();
    }
}
