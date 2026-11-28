package com.bjjeire.api.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.product.Product;
import com.bjjeire.api.product.SizeId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

/** Many guests at once never buy more than the shelf holds (#6009, SC-003, research R5). */
class OrderConcurrencyIT extends OrderIntegrationTest {
    private static final int SHOPPERS = 12;

    @Test
    @Tag("#6009")
    void shouldHoldExactlyTheStockWhenManyGuestsBuyTheLastUnitsAtOnce() {
        Product harp = product("last-units", 4500, stock(SizeId.M, 3));
        CyclicBarrier start = new CyclicBarrier(SHOPPERS);
        List<CompletableFuture<String>> attempts = new ArrayList<>();
        try (ExecutorService pool = Executors.newFixedThreadPool(SHOPPERS)) {
            for (int i = 0; i < SHOPPERS; i++) {
                int shopper = i;
                attempts.add(CompletableFuture.supplyAsync(
                        () -> attempt(start, List.of(lineFor(harp, SizeId.M)), shopper), pool));
            }
        }

        List<String> outcomes = attempts.stream().map(CompletableFuture::join).toList();

        assertThat(outcomes).filteredOn("created"::equals).hasSize(3);
        assertThat(outcomes)
                .filteredOn(outcome -> !"created".equals(outcome))
                .allSatisfy(
                        outcome -> assertThat(outcome).isIn("urn:bjjeire:size-sold-out", "urn:bjjeire:basket-changed"));
        assertThat(held(harp.getId(), SizeId.M)).isEqualTo(3);
        assertThat(stockOf(harp.getId(), SizeId.M)).isEqualTo(3);
        assertThat(shopPaymentGateway.checkouts()).hasSize(3);
        assertThat(orderCount()).isEqualTo(3);
    }

    @Test
    @Tag("#6009")
    void shouldNeverDeadlockOrOversellTwoBasketsHoldingTheSameSizesInOppositeOrder() {
        for (int round = 0; round < 10; round++) {
            mongoTemplate.remove(new org.springframework.data.mongodb.core.query.Query(), MerchOrder.class);
            Product a = product("a-" + round, 4500, stock(SizeId.M, 1));
            Product b = product("b-" + round, 4500, stock(SizeId.M, 1));
            CyclicBarrier start = new CyclicBarrier(2);
            CompletableFuture<String> forward = CompletableFuture.supplyAsync(() ->
                    attempt(start, List.of(lineFor(a, SizeId.M), lineFor(b, SizeId.M)), 100));
            CompletableFuture<String> backward = CompletableFuture.supplyAsync(() ->
                    attempt(start, List.of(lineFor(b, SizeId.M), lineFor(a, SizeId.M)), 200));

            List<String> outcomes = List.of(forward.join(), backward.join());

            assertThat(outcomes)
                    .as("round %d", round)
                    .filteredOn("created"::equals)
                    .hasSize(1);
            assertThat(held(a.getId(), SizeId.M)).isEqualTo(1);
            assertThat(held(b.getId(), SizeId.M)).isEqualTo(1);
        }
    }

    @Test
    @Tag("#6012")
    void shouldHoldAtMostThreeUnpaidOrdersForOneEmailEvenWhenTheyArriveAtOnce() {
        Product harp = product("one-email", 4500, stock(SizeId.M, 50));
        CyclicBarrier start = new CyclicBarrier(SHOPPERS);
        List<CompletableFuture<String>> attempts = new ArrayList<>();
        try (ExecutorService pool = Executors.newFixedThreadPool(SHOPPERS)) {
            for (int i = 0; i < SHOPPERS; i++) {
                int shopper = i;
                attempts.add(CompletableFuture.supplyAsync(
                        () -> attemptAs(start, List.of(lineFor(harp, SizeId.M)), "same@example.test", shopper), pool));
            }
        }

        List<String> outcomes = attempts.stream().map(CompletableFuture::join).toList();

        // Exactly the limit, never more: each unpaid order takes one of three slots (research R7).
        assertThat(outcomes.stream().filter("created"::equals).count()).isEqualTo(3);
        assertThat(outcomes)
                .filteredOn(outcome -> !"created".equals(outcome))
                .containsOnly("urn:bjjeire:too-many-unpaid");
        long created = outcomes.stream().filter("created"::equals).count();
        assertThat(orderCount()).isEqualTo(created);
        assertThat(held(harp.getId(), SizeId.M)).isEqualTo((int) created);
    }

    @Test
    @Tag("#6012")
    void shouldHoldAtMostThreeUnpaidOrdersForOneAddressEvenWhenTheyArriveAtOnce() {
        Product harp = product("one-address", 4500, stock(SizeId.M, 50));
        CyclicBarrier start = new CyclicBarrier(SHOPPERS);
        List<CompletableFuture<String>> attempts = new ArrayList<>();
        try (ExecutorService pool = Executors.newFixedThreadPool(SHOPPERS)) {
            for (int i = 0; i < SHOPPERS; i++) {
                int shopper = i;
                attempts.add(CompletableFuture.supplyAsync(
                        () -> {
                            try {
                                start.await();
                            } catch (Exception interrupted) {
                                throw new IllegalStateException(interrupted);
                            }
                            try {
                                orderService.create(
                                        new CreateOrderCommand(
                                                List.of(lineFor(harp, SizeId.M)),
                                                "address" + shopper + "@example.test",
                                                OrderRulesTest.address("IE", null),
                                                0,
                                                true),
                                        "10.9.9.9");
                                return "created";
                            } catch (ResponseStatusException refused) {
                                return String.valueOf(refused.getBody().getType());
                            }
                        },
                        pool));
            }
        }

        List<String> outcomes = attempts.stream().map(CompletableFuture::join).toList();

        assertThat(outcomes.stream().filter("created"::equals).count()).isEqualTo(3);
        assertThat(outcomes)
                .filteredOn(outcome -> !"created".equals(outcome))
                .containsOnly("urn:bjjeire:too-many-unpaid");
        assertThat(held(harp.getId(), SizeId.M)).isEqualTo(3);
    }

    private String attemptAs(CyclicBarrier start, List<OrderLineCommand> lines, String email, int shopper) {
        try {
            start.await();
        } catch (Exception interrupted) {
            throw new IllegalStateException(interrupted);
        }
        try {
            orderService.create(
                    new CreateOrderCommand(lines, email, OrderRulesTest.address("IE", null), 0, true),
                    "10.2." + (shopper / 250) + "." + (shopper % 250));
            return "created";
        } catch (ResponseStatusException refused) {
            return String.valueOf(refused.getBody().getType());
        }
    }

    private String attempt(CyclicBarrier start, List<OrderLineCommand> lines, int shopper) {
        try {
            start.await();
        } catch (Exception interrupted) {
            throw new IllegalStateException(interrupted);
        }
        try {
            orderService.create(
                    new CreateOrderCommand(
                            lines, "shopper" + shopper + "@example.test", OrderRulesTest.address("IE", null), 0, true),
                    "10.1." + (shopper / 250) + "." + (shopper % 250));
            return "created";
        } catch (ResponseStatusException refused) {
            return String.valueOf(refused.getBody().getType());
        }
    }

    private static OrderLineCommand lineFor(Product product, SizeId sizeId) {
        return new OrderLineCommand(product.getId(), sizeId, 1, product.getPriceCents());
    }
}
