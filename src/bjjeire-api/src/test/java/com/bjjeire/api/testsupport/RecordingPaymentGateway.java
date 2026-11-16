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
    private final java.util.Map<String, CheckoutStatus> statuses = new java.util.concurrent.ConcurrentHashMap<>();
    private final AtomicInteger statusLookups = new AtomicInteger();

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
        if (failRefund.get()) {
            throw new PaymentGatewayException("Stripe refused the refund (test)", null);
        }
        refunds.add(request);
        return new RefundResult("re_test_" + sequence.incrementAndGet(), true);
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

    public void reset() {
        checkouts.clear();
        refunds.clear();
        failCheckout.set(false);
        failRefund.set(false);
        failStatus.set(false);
        statuses.clear();
        statusLookups.set(0);
    }
}
