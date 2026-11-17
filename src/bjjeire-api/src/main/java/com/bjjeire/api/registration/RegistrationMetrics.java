package com.bjjeire.api.registration;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

/**
 * Counters for each step of a sign-up's money (T107). The alert rules that watch them are in
 * {@code docs/registration-operations.md}. {@link #REFUND_FAILED} and {@link #PAYMENT_UNCONFIRMED} need the organiser;
 * the rest show the flow is healthy. The mail failure counter stays with {@link RegistrationMailSender}.
 */
@Component
public class RegistrationMetrics {
    static final String SIGNUP_STARTED = "registration.signup.started";
    static final String SIGNUP_CONFIRMED = "registration.signup.confirmed";
    static final String SIGNUP_EXPIRED = "registration.signup.expired";
    static final String REFUND_REQUESTED = "registration.refund.requested";
    static final String REFUND_SUCCEEDED = "registration.refund.succeeded";
    static final String REFUND_FAILED = "registration.refund.failures";
    static final String PAYMENT_UNCONFIRMED = "registration.payment.unconfirmed";
    static final String WEBHOOK_REJECTED = "registration.webhook.rejected";

    /** Why a Stripe webhook delivery was refused; the tag value of {@link #WEBHOOK_REJECTED}. */
    enum WebhookRejection {
        /** The webhook secret is blank or a placeholder (503). */
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
    private final Counter signUpStarted;
    private final Counter signUpConfirmed;
    private final Counter signUpExpired;
    private final Counter refundRequested;
    private final Counter refundSucceeded;
    private final Counter refundFailed;
    private final Counter paymentUnconfirmed;

    public RegistrationMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.signUpStarted = Counter.builder(SIGNUP_STARTED)
                .description("Sign-ups that took a place and were sent to Stripe Checkout")
                .register(meterRegistry);
        this.signUpConfirmed = Counter.builder(SIGNUP_CONFIRMED)
                .description("Sign-ups confirmed by Stripe's payment webhook")
                .register(meterRegistry);
        this.signUpExpired = Counter.builder(SIGNUP_EXPIRED)
                .description("Unpaid holds that ended and gave their place back")
                .register(meterRegistry);
        this.refundRequested = Counter.builder(REFUND_REQUESTED)
                .description("Refunds asked of Stripe, retries included")
                .register(meterRegistry);
        this.refundSucceeded = Counter.builder(REFUND_SUCCEEDED)
                .description("Refunds recorded as completed")
                .register(meterRegistry);
        this.refundFailed = Counter.builder(REFUND_FAILED)
                .description("Refunds Stripe refused or could not be reached for; the organiser resolves them by hand")
                .register(meterRegistry);
        this.paymentUnconfirmed = Counter.builder(PAYMENT_UNCONFIRMED)
                .description("Holds paid at Stripe with no confirming webhook when their hold ended")
                .register(meterRegistry);
        for (WebhookRejection reason : WebhookRejection.values()) {
            webhookRejectedCounter(reason);
        }
    }

    void signUpStarted() {
        signUpStarted.increment();
    }

    void signUpConfirmed() {
        signUpConfirmed.increment();
    }

    void signUpExpired() {
        signUpExpired.increment();
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

    void webhookRejected(WebhookRejection reason) {
        webhookRejectedCounter(reason).increment();
    }

    private Counter webhookRejectedCounter(WebhookRejection reason) {
        return Counter.builder(WEBHOOK_REJECTED)
                .description("Stripe webhook deliveries refused before any change")
                .tag("reason", reason.tag)
                .register(meterRegistry);
    }
}
