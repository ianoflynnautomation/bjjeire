package com.bjjeire.api.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.order.ShopPaymentGateway.CheckoutStatus;
import com.bjjeire.api.product.Product;
import com.bjjeire.api.product.SizeId;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CyclicBarrier;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

/** The fallback for a missed expiry event (FR-011): lapsed holds end, paid ones are kept and raised. */
class OrderHoldSweepIT extends OrderIntegrationTest {

    @Test
    @Tag("#6008")
    void shouldExpireALapsedHoldOnceEvenWhenSweepsRunTogether() throws Exception {
        Product harp = product("sweep", 4500, stock(SizeId.M, 5));
        String id = lapsed(harp, 2);
        CyclicBarrier start = new CyclicBarrier(2);

        List<CompletableFuture<Integer>> sweeps = List.of(sweepAfter(start), sweepAfter(start));
        int expired = sweeps.stream().mapToInt(CompletableFuture::join).sum();

        assertThat(expired).isEqualTo(1);
        assertThat(order(id).getStatus()).isEqualTo(OrderStatus.EXPIRED);
        assertThat(held(harp.getId(), SizeId.M)).isZero();
        assertThat(stockOf(harp.getId(), SizeId.M)).isEqualTo(5);
        assertThat(orderService.expireLapsedHolds()).isZero();
    }

    @Test
    @Tag("#6008")
    void shouldLeaveAHoldThatHasNotLapsed() {
        Product harp = product("fresh-hold", 4500, stock(SizeId.M, 5));
        String id = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)))
                .at("/orderId")
                .asString();
        // Past the hold, but Stripe keeps the session payable for two more minutes.
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(id)),
                Update.update("holdExpiresAt", FIXED_NOW.minus(Duration.ofMinutes(1))),
                MerchOrder.class);

        assertThat(orderService.expireLapsedHolds()).isZero();
        assertThat(order(id).getStatus()).isEqualTo(OrderStatus.AWAITING_PAYMENT);
        assertThat(held(harp.getId(), SizeId.M)).isEqualTo(1);
    }

    @Test
    @Tag("#6008")
    void shouldKeepAHoldStripeReportsPaidAndRaiseItOnce() {
        Product harp = product("paid-no-webhook", 4500, stock(SizeId.M, 5));
        String id = lapsed(harp, 1);
        shopPaymentGateway.setCheckoutStatus(order(id).getPayment().getCheckoutSessionId(), CheckoutStatus.PAID);
        double before = counter(OrderMetrics.PAYMENT_UNCONFIRMED);

        orderService.expireLapsedHolds();
        orderService.expireLapsedHolds();

        assertThat(order(id).getStatus()).isEqualTo(OrderStatus.AWAITING_PAYMENT);
        assertThat(order(id).getPayment().getUnconfirmedAlertedAt()).isEqualTo(FIXED_NOW);
        assertThat(held(harp.getId(), SizeId.M)).isEqualTo(1);
        assertThat(counter(OrderMetrics.PAYMENT_UNCONFIRMED)).isEqualTo(before + 1);
    }

    @Test
    @Tag("#6008")
    void shouldKeepTheHoldWhenStripeCannotBeAsked() {
        Product harp = product("offline-sweep", 4500, stock(SizeId.M, 5));
        String id = lapsed(harp, 1);
        shopPaymentGateway.failStatusLookups(true);

        assertThat(orderService.expireLapsedHolds()).isZero();

        assertThat(order(id).getStatus()).isEqualTo(OrderStatus.AWAITING_PAYMENT);
        assertThat(held(harp.getId(), SizeId.M)).isEqualTo(1);
    }

    @Test
    @Tag("#6008")
    void shouldCountTheHoldsStillActive() {
        Product harp = product("gauge", 4500, stock(SizeId.M, 5));
        placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)));
        lapsed(harp, 1);

        orderService.expireLapsedHolds();

        assertThat(meterRegistry.find(OrderMetrics.HOLDS_ACTIVE).gauge().value())
                .isEqualTo(1);
    }

    /** Places an order whose hold ended more than the Checkout margin ago. */
    private String lapsed(Product product, int quantity) {
        String id = placed(orderJson("lapsed" + quantity + "@example.test", 0, line(product, SizeId.M, quantity)))
                .at("/orderId")
                .asString();
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(id)),
                Update.update("holdExpiresAt", FIXED_NOW.minus(Duration.ofMinutes(3))),
                MerchOrder.class);
        return id;
    }

    private CompletableFuture<Integer> sweepAfter(CyclicBarrier start) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                start.await();
            } catch (Exception interrupted) {
                throw new IllegalStateException(interrupted);
            }
            return orderService.expireLapsedHolds();
        });
    }
}
