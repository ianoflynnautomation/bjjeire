package com.bjjeire.api.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.order.ShopPaymentGateway.ShopCheckoutRequest;
import com.bjjeire.api.product.Product;
import com.bjjeire.api.product.ProductStatus;
import com.bjjeire.api.product.SizeId;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

/** A guest's checkout: holds, prices, the address rule and the limits (User Story 3, research R1, R3, R7). */
class OrderIT extends OrderIntegrationTest {

    @Test
    @Tag("#6005")
    @Tag("#6006")
    @Tag("#6012")
    void shouldHoldTheStockAndOpenACheckoutForAGuestWithNoAccount() throws Exception {
        setDeliveryFee(650);
        Product harp = product("harp", 4500, stock(SizeId.M, 5, SizeId.L, 3));

        ResponseEntity<String> response =
                postOrder(orderJson("Aoife@Example.test", 650, line(harp, SizeId.M, 2), line(harp, SizeId.L, 1)));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode body = json(response);
        String orderId = body.at("/orderId").asString();
        String key = body.at("/orderKey").asString();
        assertThat(Base64.getUrlDecoder().decode(key)).hasSize(32);
        assertThat(body.at("/checkoutUrl").asString()).startsWith("https://checkout.stripe.test/");
        assertThat(body.at("/holdExpiresAt").asString())
                .isEqualTo(FIXED_NOW.plus(Duration.ofMinutes(30)).toString());
        assertThat(body.at("/totalCents").asInt()).isEqualTo(3 * 4500 + 650);
        assertThat(response.getBody()).doesNotContain("accessKey");

        assertThat(held(harp.getId(), SizeId.M)).isEqualTo(2);
        assertThat(held(harp.getId(), SizeId.L)).isEqualTo(1);
        assertThat(stockOf(harp.getId(), SizeId.M)).isEqualTo(5);

        MerchOrder stored = order(orderId);
        assertThat(stored.getStatus()).isEqualTo(OrderStatus.AWAITING_PAYMENT);
        assertThat(stored.getNumber()).matches("^BJE-20260531-[A-Z2-7]{6}$");
        assertThat(stored.getAccessKeyHash())
                .isEqualTo(HexFormat.of()
                        .formatHex(MessageDigest.getInstance("SHA-256")
                                .digest(key.getBytes(java.nio.charset.StandardCharsets.US_ASCII))));
        assertThat(stored.getEmail()).isEqualTo("aoife@example.test");
        assertThat(stored.getItemsCents()).isEqualTo(13_500);
        assertThat(stored.getDeliveryCents()).isEqualTo(650);
        assertThat(stored.getTotalCents()).isEqualTo(14_150);
        assertThat(stored.getClientIp()).isNotBlank();
        assertThat(stored.getPayment().getCheckoutSessionId()).startsWith("cs_test_");
        assertThat(stored.getLines())
                .extracting(OrderLine::getSizeId, OrderLine::getQuantity, OrderLine::getUnitPriceCents)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(SizeId.M, 2, 4500),
                        org.assertj.core.groups.Tuple.tuple(SizeId.L, 1, 4500));

        ShopCheckoutRequest checkout = shopPaymentGateway.checkouts().getFirst();
        assertThat(checkout.orderId()).isEqualTo(orderId);
        assertThat(checkout.lines())
                .extracting(
                        ShopPaymentGateway.ShopLineItem::name,
                        ShopPaymentGateway.ShopLineItem::unitAmountCents,
                        ShopPaymentGateway.ShopLineItem::quantity)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Harp Rashguard harp — M", 4500, 2),
                        org.assertj.core.groups.Tuple.tuple("Harp Rashguard harp — L", 4500, 1));
        assertThat(checkout.deliveryCents()).isEqualTo(650);
        assertThat(checkout.customerEmail()).isEqualTo("aoife@example.test");
        assertThat(checkout.address().country()).isEqualTo("IE");
        assertThat(checkout.expiresAt()).isEqualTo(FIXED_NOW.plus(Duration.ofMinutes(32)));
        assertThat(checkout.idempotencyKey()).isEqualTo("order-checkout-" + orderId + "-1");
        assertThat(checkout.successUrl()).isEqualTo(SITE + "/shop/orders/" + orderId + "?checkout=complete");
        assertThat(checkout.successUrl() + checkout.cancelUrl()).doesNotContain(key);
    }

    @Test
    @Tag("#6006")
    void shouldTellAVisitorTheDeliveryFeeAndWhereBjjEireDelivers() {
        setDeliveryFee(650);

        ResponseEntity<String> response = restTemplate.getForEntity(ApiRoutes.ORDER + "/delivery", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = json(response);
        assertThat(body.at("/deliveryFeeCents").asInt()).isEqualTo(650);
        assertThat(body.at("/currency").asString()).isEqualTo("EUR");
        assertThat(body.at("/countries").toString()).isEqualTo("[\"IE\",\"GB-NIR\"]");
    }

    @Test
    @Tag("#6006")
    void shouldChargeNoDeliveryUntilTheOrganiserSetsAFee() {
        Product harp = product("free-delivery", 4500, stock(SizeId.M, 5));

        JsonNode body = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)));

        assertThat(body.at("/totalCents").asInt()).isEqualTo(4500);
    }

    @Test
    @Tag("#6006")
    void shouldRefuseAnAddressOutsideIrelandAndNorthernIrelandBeforePayment() {
        Product harp = product("abroad", 4500, stock(SizeId.M, 5));

        ResponseEntity<String> britain =
                postOrder(orderJsonTo("a@example.test", 0, "GB", "SW1A 1AA", line(harp, SizeId.M, 1)));
        ResponseEntity<String> france =
                postOrder(orderJsonTo("a@example.test", 0, "FR", null, line(harp, SizeId.M, 1)));
        ResponseEntity<String> belfast =
                postOrder(orderJsonTo("a@example.test", 0, "GB", "BT1 1AA", line(harp, SizeId.M, 1)));

        for (ResponseEntity<String> refused : List.of(britain, france)) {
            assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(json(refused).at("/type").asString()).isEqualTo("urn:bjjeire:delivery-not-available");
        }
        assertThat(belfast.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(shopPaymentGateway.checkouts()).hasSize(1);
        assertThat(held(harp.getId(), SizeId.M)).isEqualTo(1);
    }

    @Test
    @Tag("#6010")
    void shouldTellTheShopperEveryLineThatChangedBeforeTheyPay() {
        Product low = product("low", 4500, stock(SizeId.M, 1));
        Product dearer = product("dearer", 5000, stock(SizeId.L, 5));
        Product hidden = product("hidden", 3000, stock(SizeId.S, 5), ProductStatus.HIDDEN);
        Product fine = product("fine", 2500, stock(SizeId.XL, 5));

        ResponseEntity<String> response = postOrder(orderJson(
                "a@example.test",
                0,
                line(low, SizeId.M, 2),
                line(dearer.getId(), SizeId.L, 1, 4500),
                line(hidden, SizeId.S, 1),
                line(fine, SizeId.XS, 1),
                line(fine, SizeId.XL, 1)));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        JsonNode body = json(response);
        assertThat(body.at("/type").asString()).isEqualTo("urn:bjjeire:basket-changed");
        JsonNode lines = body.at("/lines");
        assertThat(lines).hasSize(4);
        assertThat(lines.get(0).at("/productId").asString()).isEqualTo(low.getId());
        assertThat(lines.get(0).at("/reason").asString()).isEqualTo("SOLD_OUT");
        assertThat(lines.get(0).at("/nowAvailable").asInt()).isEqualTo(1);
        assertThat(lines.get(1).at("/reason").asString()).isEqualTo("PRICE_CHANGED");
        assertThat(lines.get(1).at("/nowPriceCents").asInt()).isEqualTo(5000);
        assertThat(lines.get(2).at("/reason").asString()).isEqualTo("UNAVAILABLE");
        assertThat(lines.get(3).at("/sizeId").asString()).isEqualTo("XS");
        assertThat(lines.get(3).at("/reason").asString()).isEqualTo("UNAVAILABLE");
        assertThat(orderCount()).isZero();
        assertThat(shopPaymentGateway.checkouts()).isEmpty();
        assertThat(held(fine.getId(), SizeId.XL)).isZero();
    }

    @Test
    @Tag("#6010")
    void shouldTellTheShopperWhenTheDeliveryFeeChanged() {
        setDeliveryFee(650);
        Product harp = product("fee-changed", 4500, stock(SizeId.M, 5));

        ResponseEntity<String> response = postOrder(orderJson("a@example.test", 500, line(harp, SizeId.M, 1)));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        JsonNode body = json(response);
        assertThat(body.at("/type").asString()).isEqualTo("urn:bjjeire:basket-changed");
        assertThat(body.at("/nowDeliveryCents").asInt()).isEqualTo(650);
        assertThat(body.at("/lines")).isEmpty();
        assertThat(orderCount()).isZero();
    }

    @Test
    @Tag("#6005")
    void shouldRefuseABasketThatIsTooLarge() {
        Product harp = product("too-large", 4500, stock(SizeId.M, 50, SizeId.L, 50, SizeId.XL, 50));

        ResponseEntity<String> oneLine = postOrder(orderJson("a@example.test", 0, line(harp, SizeId.M, 11)));
        ResponseEntity<String> wholeOrder = postOrder(orderJson(
                "a@example.test", 0, line(harp, SizeId.M, 10), line(harp, SizeId.L, 10), line(harp, SizeId.XL, 1)));

        for (ResponseEntity<String> refused : List.of(oneLine, wholeOrder)) {
            assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(json(refused).at("/type").asString()).isEqualTo("urn:bjjeire:basket-too-large");
        }
        assertThat(held(harp.getId(), SizeId.M)).isZero();
    }

    @Test
    @Tag("#6005")
    void shouldRefuseAQuantityOfZeroWithAClearMessage() {
        Product harp = product("zero", 4500, stock(SizeId.M, 5));

        ResponseEntity<String> response = postOrder(orderJson("a@example.test", 0, line(harp, SizeId.M, 0)));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("Lines[0].Quantity");
        assertThat(orderCount()).isZero();
    }

    @Test
    @Tag("#6012")
    void shouldRefuseAFourthUnpaidOrderFromTheSameEmail() {
        Product harp = product("by-email", 4500, stock(SizeId.M, 10));
        for (int i = 1; i <= 3; i++) {
            orderService.create(command(harp, "Same@example.test"), "10.0.0." + i);
        }

        ResponseStatusException refused = org.junit.jupiter.api.Assertions.assertThrows(
                ResponseStatusException.class,
                () -> orderService.create(command(harp, "same@example.test"), "10.0.0.4"));

        assertThat(refused.getBody().getType().toString()).isEqualTo("urn:bjjeire:too-many-unpaid");
        assertThat(held(harp.getId(), SizeId.M)).isEqualTo(3);
    }

    @Test
    @Tag("#6012")
    void shouldRefuseAFourthUnpaidOrderFromTheSameAddress() {
        Product harp = product("by-ip", 4500, stock(SizeId.M, 10));
        for (int i = 1; i <= 3; i++) {
            placed(orderJson("shopper" + i + "@example.test", 0, line(harp, SizeId.M, 1)));
        }

        ResponseEntity<String> fourth = postOrder(orderJson("shopper4@example.test", 0, line(harp, SizeId.M, 1)));

        assertThat(fourth.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(json(fourth).at("/type").asString()).isEqualTo("urn:bjjeire:too-many-unpaid");
        assertThat(held(harp.getId(), SizeId.M)).isEqualTo(3);
    }

    @Test
    @Tag("#6012")
    void shouldFreeAnUnpaidSlotWhenAnOrderEnds() {
        Product harp = product("slot-freed", 4500, stock(SizeId.M, 10));
        List<String> ids = new java.util.ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            ids.add(orderService
                    .create(command(harp, "slots@example.test"), "10.3.0." + i)
                    .orderId());
        }
        MerchOrder first = order(ids.getFirst());
        postSignedWebhook(checkoutEvent("evt_slot_exp", "checkout.session.expired", first, "unpaid", "order"));
        MerchOrder second = order(ids.get(1));
        postSignedWebhook(paidEvent("evt_slot_paid", second));

        orderService.create(command(harp, "slots@example.test"), "10.3.0.4");
        orderService.create(command(harp, "slots@example.test"), "10.3.0.5");

        assertThat(order(ids.getFirst()).getEmailSlot()).isNull();
        assertThat(order(ids.get(1)).getEmailSlot()).isNull();
        assertThat(order(ids.get(1)).getIpSlot()).isNull();
        ResponseStatusException fourth = org.junit.jupiter.api.Assertions.assertThrows(
                ResponseStatusException.class,
                () -> orderService.create(command(harp, "slots@example.test"), "10.3.0.6"));
        assertThat(fourth.getBody().getType().toString()).isEqualTo("urn:bjjeire:too-many-unpaid");
    }

    @Test
    void shouldReleaseEveryHoldAndKeepNoOrderWhenStripeIsUnreachable() {
        Product harp = product("offline", 4500, stock(SizeId.M, 5, SizeId.L, 5));
        shopPaymentGateway.failNextCheckouts(true);

        ResponseEntity<String> response =
                postOrder(orderJson("a@example.test", 0, line(harp, SizeId.M, 2), line(harp, SizeId.L, 1)));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(json(response).at("/type").asString()).isEqualTo("urn:bjjeire:payment-unavailable");
        assertThat(held(harp.getId(), SizeId.M)).isZero();
        assertThat(held(harp.getId(), SizeId.L)).isZero();
        assertThat(orderCount()).isZero();
    }

    @Test
    @Tag("#6015")
    void shouldKeepThePricesAndDeliveryPaidWhenTheOrganiserChangesThemLater() {
        setDeliveryFee(650);
        Product harp = product("price-kept", 4500, stock(SizeId.M, 5));
        JsonNode checkout = placed(orderJson("a@example.test", 650, line(harp, SizeId.M, 1)));
        String orderId = checkout.at("/orderId").asString();
        pay(orderId);

        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(harp.getId())),
                Update.update("priceCents", 6000).set("name", "Renamed"),
                Product.class);
        setDeliveryFee(900);

        JsonNode read = json(getOrder(orderId, checkout.at("/orderKey").asString()));
        assertThat(read.at("/lines/0/unitPriceCents").asInt()).isEqualTo(4500);
        assertThat(read.at("/lines/0/productName").asString()).isEqualTo("Harp Rashguard price-kept");
        assertThat(read.at("/deliveryCents").asInt()).isEqualTo(650);
        assertThat(read.at("/totalCents").asInt()).isEqualTo(5150);
    }

    @Test
    void shouldAnswerBadRequestForABodyThatIsNotJson() {
        ResponseEntity<String> response =
                restTemplate.exchange(ApiRoutes.ORDER, HttpMethod.POST, jsonEntity("{not json", null), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(json(response).at("/type").asString()).isEqualTo("urn:bjjeire:bad-request");
    }

    @Test
    @Tag("#6012")
    void shouldNeedANameAndEmailButNoSignIn() {
        Product harp = product("guest", 4500, stock(SizeId.M, 5));

        ResponseEntity<String> noEmail = postOrder(orderJson(null, 0, line(harp, SizeId.M, 1)));

        assertThat(noEmail.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(noEmail.getBody()).contains("\"Email\"");
        assertThat(noEmail.getHeaders().get("WWW-Authenticate")).isNull();
    }

    private static CreateOrderCommand command(Product product, String email) {
        return new CreateOrderCommand(
                List.of(new OrderLineCommand(product.getId(), SizeId.M, 1, product.getPriceCents())),
                email,
                OrderRulesTest.address("IE", null),
                0,
                true);
    }
}
