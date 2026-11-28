package com.bjjeire.api.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.order.ShopPaymentGateway.CheckoutStatus;
import com.bjjeire.api.product.Product;
import com.bjjeire.api.product.SizeId;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;

/** A guest reads their order with the key from its link, and nobody else can (research R6, FR-015). */
class OrderAccessIT extends OrderIntegrationTest {

    @Test
    @Tag("#6011")
    void shouldShowTheOrderToTheHolderOfItsKey() {
        setDeliveryFee(650);
        Product harp = product("read", 4500, stock(SizeId.M, 5));
        JsonNode checkout = placed(orderJson("aoife@example.test", 650, line(harp, SizeId.M, 2)));
        String orderId = checkout.at("/orderId").asString();
        String key = checkout.at("/orderKey").asString();
        pay(orderId);

        ResponseEntity<String> response = getOrder(orderId, key);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode order = json(response);
        assertThat(order.at("/id").asString()).isEqualTo(orderId);
        assertThat(order.at("/number").asString()).matches("^BJE-\\d{8}-[A-Z2-7]{6}$");
        assertThat(order.at("/status").asString()).isEqualTo("CONFIRMED");
        assertThat(order.at("/lines/0/productId").asString()).isEqualTo(harp.getId());
        assertThat(order.at("/lines/0/sizeId").asString()).isEqualTo("M");
        assertThat(order.at("/lines/0/quantity").asInt()).isEqualTo(2);
        assertThat(order.at("/lines/0/lineCents").asInt()).isEqualTo(9000);
        assertThat(order.at("/itemsCents").asInt()).isEqualTo(9000);
        assertThat(order.at("/deliveryCents").asInt()).isEqualTo(650);
        assertThat(order.at("/totalCents").asInt()).isEqualTo(9650);
        assertThat(order.at("/currency").asString()).isEqualTo("EUR");
        assertThat(order.at("/email").asString()).isEqualTo("aoife@example.test");
        assertThat(order.at("/address/name").asString()).isEqualTo("Aoife Byrne");
        assertThat(order.at("/address/postcode").asString()).isEqualTo("H91 E2K3");
        assertThat(order.at("/paidAt").asString()).isEqualTo(FIXED_NOW.toString());
    }

    @Test
    @Tag("#6011")
    void shouldAnswerNotFoundForAWrongMissingOrOtherOrdersKeyAsForAnUnknownId() {
        Product harp = product("guarded", 4500, stock(SizeId.M, 5));
        JsonNode mine = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)));
        JsonNode theirs = placed(orderJson("b@example.test", 0, line(harp, SizeId.M, 1)));
        String id = mine.at("/orderId").asString();

        List<ResponseEntity<String>> refused = List.of(
                getOrder(id, "wrong"),
                getOrder(id, null),
                getOrder(id, ""),
                getOrder(id, theirs.at("/orderKey").asString()),
                getOrder("6650f0c2a1b2c3d4e5f60718", mine.at("/orderKey").asString()),
                resumeCheckout(id, null),
                resumeCheckout(id, theirs.at("/orderKey").asString()));

        assertThat(refused).allSatisfy(response -> {
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(json(response).at("/type").asString()).isEqualTo("urn:bjjeire:not-found");
        });
    }

    @Test
    @Tag("#6011")
    void shouldNeverReturnTheStoredKeyOrItsHash() {
        Product harp = product("secret", 4500, stock(SizeId.M, 5));
        ResponseEntity<String> created = postOrder(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)));
        JsonNode checkout = json(created);
        String id = checkout.at("/orderId").asString();
        String key = checkout.at("/orderKey").asString();

        ResponseEntity<String> read = getOrder(id, key);
        ResponseEntity<String> resumed = resumeCheckout(id, key);

        for (ResponseEntity<String> response : List.of(created, read, resumed)) {
            assertThat(response.getBody())
                    .doesNotContain("accessKey")
                    .doesNotContain(order(id).getAccessKeyHash());
        }
        assertThat(read.getBody()).doesNotContain(key).doesNotContain("clientIp");
        assertThat(resumed.getBody()).doesNotContain(key);
    }

    @Test
    @Tag("#6008")
    void shouldReturnTheOpenCheckoutAgainWhileTheHoldLasts() {
        Product harp = product("resume", 4500, stock(SizeId.M, 5));
        JsonNode checkout = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)));
        String id = checkout.at("/orderId").asString();

        ResponseEntity<String> resumed =
                resumeCheckout(id, checkout.at("/orderKey").asString());

        assertThat(resumed.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = json(resumed);
        assertThat(body.at("/orderId").asString()).isEqualTo(id);
        assertThat(body.at("/checkoutUrl").asString())
                .isEqualTo(checkout.at("/checkoutUrl").asString());
        assertThat(body.has("orderKey")).isFalse();
        assertThat(shopPaymentGateway.checkouts()).hasSize(1);
    }

    @Test
    @Tag("#6008")
    void shouldSayTheHoldEndedOnceItHas() {
        Product harp = product("lapsed", 4500, stock(SizeId.M, 5));
        JsonNode checkout = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)));
        String id = checkout.at("/orderId").asString();
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(id)),
                Update.update("holdExpiresAt", FIXED_NOW.minusSeconds(1)),
                MerchOrder.class);

        ResponseEntity<String> resumed =
                resumeCheckout(id, checkout.at("/orderKey").asString());

        assertThat(resumed.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(json(resumed).at("/type").asString()).isEqualTo("urn:bjjeire:hold-expired");
    }

    @Test
    @Tag("#6008")
    void shouldSayThePaymentWasReceivedWhenStripeHasItButNoWebhookYet() {
        Product harp = product("received", 4500, stock(SizeId.M, 5));
        JsonNode checkout = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)));
        String id = checkout.at("/orderId").asString();
        shopPaymentGateway.setCheckoutStatus(order(id).getPayment().getCheckoutSessionId(), CheckoutStatus.PAID);

        ResponseEntity<String> resumed =
                resumeCheckout(id, checkout.at("/orderKey").asString());

        assertThat(resumed.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(json(resumed).at("/type").asString()).isEqualTo("urn:bjjeire:payment-received");
    }
}
