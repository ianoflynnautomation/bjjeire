package com.bjjeire.api.testsupport;

import com.bjjeire.api.order.ShopPaymentGateway;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/** Stands in for Stripe in the shop's integration tests: records every call and answers with predictable ids. */
public class RecordingShopPaymentGateway implements ShopPaymentGateway {
    private final List<ShopCheckoutRequest> checkouts = new CopyOnWriteArrayList<>();
    private final List<ShopRefundRequest> refunds = new CopyOnWriteArrayList<>();
    private final AtomicInteger sequence = new AtomicInteger();
    private final AtomicBoolean failCheckout = new AtomicBoolean();
    private final AtomicBoolean failStatus = new AtomicBoolean();
    private final AtomicInteger refundFailuresLeft = new AtomicInteger();
    private final Map<String, CheckoutStatus> statuses = new ConcurrentHashMap<>();
    private final Map<String, RefundResult> refundsByKey = new ConcurrentHashMap<>();

    @Override
    public CheckoutSession createCheckout(ShopCheckoutRequest request) {
        if (failCheckout.get()) {
            throw new PaymentGatewayException("Stripe is unreachable (test)", null);
        }
        checkouts.add(request);
        String id = "cs_test_shop_" + sequence.incrementAndGet();
        return new CheckoutSession(id, "https://checkout.stripe.test/c/pay/" + id);
    }

    @Override
    public RefundResult refund(ShopRefundRequest request) {
        if (refundFailuresLeft.getAndUpdate(left -> Math.max(0, left - 1)) > 0) {
            throw new PaymentGatewayException("Stripe refused the refund (test)", null);
        }
        // Like Stripe: a key already used replays the first answer and creates no second refund.
        RefundResult earlier = refundsByKey.get(request.idempotencyKey());
        if (earlier != null) {
            return earlier;
        }
        refunds.add(request);
        RefundResult result = new RefundResult("re_test_shop_" + sequence.incrementAndGet(), true);
        refundsByKey.put(request.idempotencyKey(), result);
        return result;
    }

    @Override
    public CheckoutStatus checkoutStatus(String checkoutSessionId) {
        if (failStatus.get()) {
            throw new PaymentGatewayException("Stripe is unreachable (test)", null);
        }
        return statuses.getOrDefault(checkoutSessionId, CheckoutStatus.OPEN);
    }

    public void setCheckoutStatus(String checkoutSessionId, CheckoutStatus status) {
        statuses.put(checkoutSessionId, status);
    }

    public void failNextCheckouts(boolean fail) {
        failCheckout.set(fail);
    }

    public void failStatusLookups(boolean fail) {
        failStatus.set(fail);
    }

    /** Fails only the next {@code count} refunds, then accepts them again. */
    public void failRefunds(int count) {
        refundFailuresLeft.set(count);
    }

    public List<ShopCheckoutRequest> checkouts() {
        return List.copyOf(checkouts);
    }

    public List<ShopRefundRequest> refunds() {
        return List.copyOf(refunds);
    }

    public void reset() {
        checkouts.clear();
        refunds.clear();
        failCheckout.set(false);
        failStatus.set(false);
        refundFailuresLeft.set(0);
        statuses.clear();
        refundsByKey.clear();
    }
}
