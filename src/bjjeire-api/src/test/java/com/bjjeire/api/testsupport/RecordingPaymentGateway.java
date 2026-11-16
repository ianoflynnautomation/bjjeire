package com.bjjeire.api.testsupport;

import com.bjjeire.api.registration.PaymentGateway;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/** Stands in for Stripe in integration tests: records every call and answers with predictable ids. */
public class RecordingPaymentGateway implements PaymentGateway {
    private final List<CheckoutRequest> checkouts = new CopyOnWriteArrayList<>();
    private final List<RefundRequest> refunds = new CopyOnWriteArrayList<>();
    private final AtomicInteger sequence = new AtomicInteger();
    private final AtomicBoolean failCheckout = new AtomicBoolean();
    private final AtomicBoolean failRefund = new AtomicBoolean();
    private final AtomicBoolean failStatus = new AtomicBoolean();
    private final AtomicBoolean refundsPending = new AtomicBoolean();
    private final AtomicInteger refundFailuresLeft = new AtomicInteger();
    private final java.util.Map<String, CheckoutStatus> statuses = new java.util.concurrent.ConcurrentHashMap<>();
    private final AtomicInteger statusLookups = new AtomicInteger();
    private final java.util.Map<String, RefundResult> refundsByKey = new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    public CheckoutSession createCheckout(CheckoutRequest request) {
        if (failCheckout.get()) {
            throw new PaymentGatewayException("Stripe is unreachable (test)", null);
        }
        checkouts.add(request);
        String id = "cs_test_" + sequence.incrementAndGet();
        return new CheckoutSession(id, "https://checkout.stripe.test/c/pay/" + id);
    }

    @Override
    public RefundResult refund(RefundRequest request) {
        if (failRefund.get() || refundFailuresLeft.getAndUpdate(left -> Math.max(0, left - 1)) > 0) {
            throw new PaymentGatewayException("Stripe refused the refund (test)", null);
        }
        // Like Stripe: a key already used replays the first answer and creates no second refund.
        RefundResult earlier = refundsByKey.get(request.idempotencyKey());
        if (earlier != null) {
            return earlier;
        }
        refunds.add(request);
        RefundResult result = new RefundResult("re_test_" + sequence.incrementAndGet(), !refundsPending.get());
        refundsByKey.put(request.idempotencyKey(), result);
        return result;
    }

    @Override
    public CheckoutStatus checkoutStatus(String checkoutSessionId) {
        statusLookups.incrementAndGet();
        if (failStatus.get()) {
            throw new PaymentGatewayException("Stripe is unreachable (test)", null);
        }
        return statuses.getOrDefault(checkoutSessionId, CheckoutStatus.OPEN);
    }

    /** What Stripe reports for a session from now on; OPEN until set. */
    public void setCheckoutStatus(String checkoutSessionId, CheckoutStatus status) {
        statuses.put(checkoutSessionId, status);
    }

    public void failStatusLookups(boolean fail) {
        failStatus.set(fail);
    }

    public int statusLookups() {
        return statusLookups.get();
    }

    public List<CheckoutRequest> checkouts() {
        return List.copyOf(checkouts);
    }

    public List<RefundRequest> refunds() {
        return List.copyOf(refunds);
    }

    public void failNextCheckouts(boolean fail) {
        failCheckout.set(fail);
    }

    public void failNextRefunds(boolean fail) {
        failRefund.set(fail);
    }

    /** Fails only the next {@code count} refunds, then accepts them again. */
    public void failRefunds(int count) {
        refundFailuresLeft.set(count);
    }

    /** Whether Stripe reports new refunds as pending (true) or already succeeded (false, the default). */
    public void reportRefundsPending(boolean pending) {
        refundsPending.set(pending);
    }

    public void reset() {
        checkouts.clear();
        refunds.clear();
        failCheckout.set(false);
        failRefund.set(false);
        failStatus.set(false);
        refundsPending.set(false);
        refundsByKey.clear();
        refundFailuresLeft.set(0);
        statuses.clear();
        statusLookups.set(0);
    }
}
