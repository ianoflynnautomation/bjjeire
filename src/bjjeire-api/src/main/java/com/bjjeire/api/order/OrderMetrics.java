package com.bjjeire.api.order;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/**
 * Counters for each step of an order's money (contracts/stripe-webhook.md § Metrics). {@link #REFUND_FAILED} and
 * {@link #PAYMENT_UNCONFIRMED} need the organiser; the rest show the flow is healthy. The mail failure counter stays
 * with {@link OrderMailSender}.
 */
@Component
public class OrderMetrics {
    static final String CHECKOUT_STARTED = "order.checkout.started";
    static final String CONFIRMED = "order.confirmed";
    static final String EXPIRED = "order.expired";
    static final String REFUND_REQUESTED = "order.refund.requested";
    static final String REFUND_SUCCEEDED = "order.refund.succeeded";
    static final String REFUND_FAILED = "order.refund.failures";
    static final String PAYMENT_UNCONFIRMED = "order.payment.unconfirmed";
    static final String WEBHOOK_REJECTED = "order.webhook.rejected";
    static final String HOLDS_ACTIVE = "order.holds.active";

    /** Why a shop webhook delivery was refused; the tag value of {@link #WEBHOOK_REJECTED}. */
    enum WebhookRejection {
        /** The shop's webhook secret is blank or a placeholder (503). */
        UNCONFIGURED("unconfigured"),
        /** The {@code Stripe-Signature} header is missing, stale or does not match the body (400). */
        SIGNATURE("signature"),
        /** A signed body that is not JSON or has no event id or type (400). */
        MALFORMED("malformed");

        private final String tag;

        WebhookRejection(String tag) {
            this.tag = tag;
        }
    }

    private final MeterRegistry meterRegistry;
    private final Counter checkoutStarted;
    private final Counter confirmed;
    private final Counter expired;
    private final Counter refundRequested;
    private final Counter refundSucceeded;
    private final Counter refundFailed;
    private final Counter paymentUnconfirmed;
    private final AtomicInteger holdsActive = new AtomicInteger();

    public OrderMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.checkoutStarted = counter(CHECKOUT_STARTED, "Orders whose stock was held and sent to Stripe Checkout");
        this.confirmed = counter(CONFIRMED, "Orders confirmed by the shop's payment webhook");
        this.expired = counter(EXPIRED, "Unpaid orders whose hold ended and whose stock went back");
        this.refundRequested = counter(REFUND_REQUESTED, "Order refunds asked of Stripe, retries included");
        this.refundSucceeded = counter(REFUND_SUCCEEDED, "Order refunds recorded as completed");
        this.refundFailed =
                counter(REFUND_FAILED, "Order refunds Stripe refused or could not be reached for; resolved by hand");
        this.paymentUnconfirmed =
                counter(PAYMENT_UNCONFIRMED, "Orders paid at Stripe with no confirming webhook when their hold ended");
        Gauge.builder(HOLDS_ACTIVE, holdsActive, AtomicInteger::get)
                .description("Orders holding stock while awaiting payment, as of the last hold sweep")
                .register(meterRegistry);
        for (WebhookRejection reason : WebhookRejection.values()) {
            webhookRejectedCounter(reason);
        }
    }

    void checkoutStarted() {
        checkoutStarted.increment();
    }

    void confirmed() {
        confirmed.increment();
    }

    void expired() {
        expired.increment();
    }

    void refundRequested() {
        refundRequested.increment();
    }

    void refundSucceeded() {
        refundSucceeded.increment();
    }

    void refundFailed() {
        refundFailed.increment();
    }

    void paymentUnconfirmed() {
        paymentUnconfirmed.increment();
    }

    void holdsActive(long count) {
        holdsActive.set((int) Math.min(Integer.MAX_VALUE, count));
    }

    void webhookRejected(WebhookRejection reason) {
        webhookRejectedCounter(reason).increment();
    }

    private Counter counter(String name, String description) {
        return Counter.builder(name).description(description).register(meterRegistry);
    }

    private Counter webhookRejectedCounter(WebhookRejection reason) {
        return Counter.builder(WEBHOOK_REJECTED)
                .description("Shop Stripe webhook deliveries refused before any change")
                .tag("reason", reason.tag)
                .register(meterRegistry);
    }
}
