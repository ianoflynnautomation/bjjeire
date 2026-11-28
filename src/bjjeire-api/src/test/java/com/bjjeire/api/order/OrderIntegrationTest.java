package com.bjjeire.api.order;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.product.Product;
import com.bjjeire.api.product.ProductKind;
import com.bjjeire.api.product.ProductSize;
import com.bjjeire.api.product.ProductStatus;
import com.bjjeire.api.product.SizeId;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Calls the order routes the way the SPA and Stripe do. Adds no context configuration, so it shares the one context.
 */
abstract class OrderIntegrationTest extends MongoIntegrationTest {
    /** Must match bjjeire.stripe.shop-webhook-secret in src/test/resources/application.yml. */
    static final String SHOP_WEBHOOK_SECRET = "whsec_shop_integration_test_secret";

    static final String SITE = "http://localhost:5173";

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected OrderService orderService;

    @Autowired
    protected MeterRegistry meterRegistry;

    // ---- Catalogue ------------------------------------------------------------------------------------------------

    /** Inserts a published rashguard with a photo and the given stock per size. */
    protected Product product(String slug, int priceCents, Map<SizeId, Integer> stock) {
        return product(slug, priceCents, stock, ProductStatus.PUBLISHED);
    }

    protected Product product(String slug, int priceCents, Map<SizeId, Integer> stock, ProductStatus status) {
        List<ProductSize> sizes = new ArrayList<>();
        stock.forEach((size, count) ->
                sizes.add(ProductSize.builder().id(size).stock(count).held(0).build()));
        return mongoTemplate.insert(Product.builder()
                .slug(slug)
                .name("Harp Rashguard " + slug)
                .kind(ProductKind.RASHGUARD)
                .description("Long sleeve.")
                .priceCents(priceCents)
                .photos(new ArrayList<>(List.of("a".repeat(64))))
                .sizes(sizes)
                .status(status)
                .version(1L)
                .createdOnUtc(FIXED_NOW)
                .build());
    }

    protected static Map<SizeId, Integer> stock(Object... sizeThenCount) {
        Map<SizeId, Integer> stock = new LinkedHashMap<>();
        for (int i = 0; i < sizeThenCount.length; i += 2) {
            stock.put((SizeId) sizeThenCount[i], (Integer) sizeThenCount[i + 1]);
        }
        return stock;
    }

    protected ProductSize size(String productId, SizeId sizeId) {
        return mongoTemplate.findById(productId, Product.class).getSizes().stream()
                .filter(size -> size.getId() == sizeId)
                .findFirst()
                .orElseThrow();
    }

    protected int held(String productId, SizeId sizeId) {
        return size(productId, sizeId).getHeld();
    }

    protected int stockOf(String productId, SizeId sizeId) {
        return size(productId, sizeId).getStock();
    }

    protected void setDeliveryFee(int cents) {
        mongoTemplate.upsert(
                Query.query(Criteria.where("_id").is(ShopSettings.ID)),
                new Update().set("deliveryFeeCents", cents).set("version", 1L),
                ShopSettings.class);
    }

    // ---- Requests -------------------------------------------------------------------------------------------------

    static String line(Product product, SizeId sizeId, int quantity) {
        return line(product.getId(), sizeId, quantity, product.getPriceCents());
    }

    static String line(String productId, SizeId sizeId, int quantity, int unitPriceCents) {
        return """
                {"productId":"%s","sizeId":"%s","quantity":%d,"unitPriceCents":%d}""".formatted(productId, sizeId, quantity, unitPriceCents);
    }

    static String orderJson(String email, int deliveryCents, String... lines) {
        return orderJsonTo(email, deliveryCents, "IE", "H91 E2K3", lines);
    }

    static String orderJsonTo(String email, int deliveryCents, String country, String postcode, String... lines) {
        return """
                {
                  "lines": [%s],
                  "email": %s,
                  "address": {
                    "name": "Aoife Byrne",
                    "line1": "1 Shop Street",
                    "town": "Galway",
                    "county": "Galway",
                    "postcode": %s,
                    "country": "%s",
                    "phone": "+353 91 000 000"
                  },
                  "deliveryCents": %d,
                  "acceptTerms": true
                }""".formatted(
                        String.join(",", lines),
                        email == null ? "null" : "\"" + email + "\"",
                        postcode == null ? "null" : "\"" + postcode + "\"",
                        country,
                        deliveryCents);
    }

    protected ResponseEntity<String> postOrder(String body) {
        return restTemplate.exchange(ApiRoutes.ORDER, HttpMethod.POST, jsonEntity(body, null), String.class);
    }

    protected ResponseEntity<String> getOrder(String id, String key) {
        return restTemplate.exchange(ApiRoutes.ORDER + "/" + id, HttpMethod.GET, keyed(null, key), String.class);
    }

    protected ResponseEntity<String> resumeCheckout(String id, String key) {
        return restTemplate.exchange(
                ApiRoutes.ORDER + "/" + id + "/checkout", HttpMethod.POST, keyed(null, key), String.class);
    }

    private static HttpEntity<String> keyed(String body, String key) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (key != null) {
            headers.set(OrderController.ORDER_KEY_HEADER, key);
        }
        return new HttpEntity<>(body, headers);
    }

    protected JsonNode json(ResponseEntity<String> response) {
        return objectMapper.readTree(response.getBody());
    }

    /** Places an order and returns its response, failing the test when it was refused. */
    protected JsonNode placed(String body) {
        ResponseEntity<String> response = postOrder(body);
        if (response.getStatusCode().value() != 201) {
            throw new IllegalStateException("Order refused: " + response.getBody());
        }
        return json(response);
    }

    protected MerchOrder order(String id) {
        return mongoTemplate.findById(id, MerchOrder.class);
    }

    protected long orderCount() {
        return mongoTemplate.count(new Query(), MerchOrder.class);
    }

    // ---- Stripe ---------------------------------------------------------------------------------------------------

    static String checkoutEvent(String eventId, String type, MerchOrder order, String paymentStatus, String kind) {
        String metadata = kind == null
                ? "{ \"orderId\": \"%s\" }".formatted(order.getId())
                : "{ \"orderId\": \"%s\", \"bjjeireKind\": \"%s\" }".formatted(order.getId(), kind);
        return """
            {
              "id": "%s",
              "object": "event",
              "type": "%s",
              "data": {
                "object": {
                  "id": "%s",
                  "object": "checkout.session",
                  "client_reference_id": "%s",
                  "metadata": %s,
                  "payment_intent": "pi_test_%s",
                  "payment_status": "%s",
                  "amount_total": %d,
                  "currency": "eur"
                }
              }
            }""".formatted(
                        eventId,
                        type,
                        order.getPayment().getCheckoutSessionId(),
                        order.getId(),
                        metadata,
                        order.getId(),
                        paymentStatus,
                        order.getTotalCents());
    }

    static String paidEvent(String eventId, MerchOrder order) {
        return checkoutEvent(eventId, "checkout.session.completed", order, "paid", "order");
    }

    protected ResponseEntity<String> postSignedWebhook(String payload) {
        return postWebhook(payload, signature(payload, FIXED_NOW, SHOP_WEBHOOK_SECRET));
    }

    protected ResponseEntity<String> postWebhook(String payload, String signatureHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (signatureHeader != null) {
            headers.set("Stripe-Signature", signatureHeader);
        }
        return restTemplate.exchange(
                ApiRoutes.ORDER_STRIPE_WEBHOOK, HttpMethod.POST, new HttpEntity<>(payload, headers), String.class);
    }

    /** Sends a signed "paid" event for the order and waits for its confirmation mail. */
    protected MerchOrder pay(String orderId) {
        int mailsBefore = mailer.sent().size();
        ResponseEntity<String> paid = postSignedWebhook(paidEvent("evt_paid_" + orderId, order(orderId)));
        if (paid.getStatusCode().value() != 200) {
            throw new IllegalStateException("Webhook failed: " + paid.getBody());
        }
        mailer.awaitSent(mailsBefore + 1);
        return order(orderId);
    }

    /** A {@code Stripe-Signature} header as Stripe builds it: HMAC-SHA256 over {@code timestamp.payload}. */
    static String signature(String payload, Instant timestamp, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String signed = timestamp.getEpochSecond() + "." + payload;
            String digest = HexFormat.of().formatHex(mac.doFinal(signed.getBytes(StandardCharsets.UTF_8)));
            return "t=" + timestamp.getEpochSecond() + ",v1=" + digest;
        } catch (java.security.GeneralSecurityException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    protected double counter(String name, String... tags) {
        Counter counter = meterRegistry.find(name).tags(tags).counter();
        return counter == null ? 0 : counter.count();
    }
}
