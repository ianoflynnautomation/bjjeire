package com.bjjeire.api.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.MailMessage;
import com.bjjeire.api.product.Product;
import com.bjjeire.api.product.SizeId;
import com.bjjeire.api.registration.StripeEvent;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;

/** The shop's signed webhook: the only thing that confirms an order (ADR-0016, contracts/stripe-webhook.md). */
class OrderWebhookIT extends OrderIntegrationTest {

    @Test
    @Tag("#6007")
    void shouldRefuseAMissingOrBadSignatureCountItAndChangeNothing() {
        Product harp = product("bad-signature", 4500, stock(SizeId.M, 5));
        MerchOrder order = order(placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)))
                .at("/orderId")
                .asString());
        String payload = paidEvent("evt_bad", order);
        double before = counter(OrderMetrics.WEBHOOK_REJECTED, "reason", "signature");

        ResponseEntity<String> unsigned = postWebhook(payload, null);
        ResponseEntity<String> registrationSecret =
                postWebhook(payload, signature(payload, FIXED_NOW, "whsec_integration_test_secret"));
        ResponseEntity<String> stale =
                postWebhook(payload, signature(payload, FIXED_NOW.minus(Duration.ofHours(1)), SHOP_WEBHOOK_SECRET));

        assertThat(List.of(unsigned, registrationSecret, stale))
                .allSatisfy(response -> assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThat(counter(OrderMetrics.WEBHOOK_REJECTED, "reason", "signature"))
                .isEqualTo(before + 3);
        assertThat(order(order.getId()).getStatus()).isEqualTo(OrderStatus.AWAITING_PAYMENT);
        assertThat(mongoTemplate.count(new Query(), OrderStripeEvent.class)).isZero();
    }

    @Test
    @Tag("#6007")
    void shouldConfirmTheOrderCommitTheStockAndSendOneMailWhenThePaymentSucceeds() {
        setDeliveryFee(650);
        Product harp = product("paid", 4500, stock(SizeId.M, 5, SizeId.L, 3));
        JsonNode checkout =
                placed(orderJson("aoife@example.test", 650, line(harp, SizeId.M, 2), line(harp, SizeId.L, 1)));
        String orderId = checkout.at("/orderId").asString();
        String key = checkout.at("/orderKey").asString();

        ResponseEntity<String> response = postSignedWebhook(paidEvent("evt_paid", order(orderId)));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        MerchOrder confirmed = order(orderId);
        assertThat(confirmed.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(confirmed.getPayment().getStatus()).isEqualTo(OrderPaymentStatus.PAID);
        assertThat(confirmed.getPayment().getPaidAt()).isEqualTo(FIXED_NOW);
        assertThat(confirmed.getPayment().getPaymentIntentId()).isEqualTo("pi_test_" + orderId);
        assertThat(confirmed.getHoldExpiresAt()).isNull();
        assertThat(confirmed.getClientIp()).isNull();
        assertThat(confirmed.getAccessKey()).isNull();
        assertThat(confirmed.getRetainUntil())
                .isEqualTo(
                        FIXED_NOW.atZone(java.time.ZoneOffset.UTC).plusYears(6).toInstant());
        assertThat(stockOf(harp.getId(), SizeId.M)).isEqualTo(3);
        assertThat(stockOf(harp.getId(), SizeId.L)).isEqualTo(2);
        assertThat(held(harp.getId(), SizeId.M)).isZero();
        assertThat(held(harp.getId(), SizeId.L)).isZero();

        List<MailMessage> sent = mailer.awaitSent(1);
        assertThat(sent).hasSize(1);
        MailMessage mail = sent.getFirst();
        assertThat(mail.to()).isEqualTo("aoife@example.test");
        assertThat(mail.subject()).contains("confirmed").contains(confirmed.getNumber());
        assertThat(mail.body())
                .contains("Harp Rashguard paid, size M × 2: €90.00")
                .contains("Harp Rashguard paid, size L × 1: €45.00")
                .contains("Delivery: €6.50")
                .contains("Paid: €141.50")
                .contains("Aoife Byrne")
                .contains("1 Shop Street")
                .contains("H91 E2K3")
                .contains(SITE + "/shop/orders/" + orderId + "#key=" + key);
        assertThat(mongoTemplate.count(new Query(), StripeEvent.class)).isZero();
        assertThat(mongoTemplate.findById("evt_paid", OrderStripeEvent.class).isHandled())
                .isTrue();
    }

    @Test
    @Tag("#6007")
    void shouldChangeNothingWhenTheSameEventOrASecondEventForThePaymentArrives() {
        Product harp = product("twice", 4500, stock(SizeId.M, 5));
        String orderId = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)))
                .at("/orderId")
                .asString();
        String payload = paidEvent("evt_twice", order(orderId));

        postSignedWebhook(payload);
        ResponseEntity<String> again = postSignedWebhook(payload);
        postSignedWebhook(paidEvent("evt_other", order(orderId)));

        assertThat(again.getStatusCode()).isEqualTo(HttpStatus.OK);
        mailer.awaitSent(2);
        assertThat(mailer.sent()).hasSize(1);
        assertThat(stockOf(harp.getId(), SizeId.M)).isEqualTo(4);
        assertThat(mongoTemplate.count(new Query(), OrderStripeEvent.class)).isEqualTo(2);
        assertThat(mongoTemplate.findById("evt_twice", OrderStripeEvent.class).getExpiresAt())
                .isEqualTo(FIXED_NOW.plus(Duration.ofDays(30)));
    }

    @Test
    @Tag("#6007")
    void shouldAcknowledgeAndIgnoreARegistrationsEventOrOneWithNoKind() {
        Product harp = product("not-ours", 4500, stock(SizeId.M, 5));
        String orderId = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)))
                .at("/orderId")
                .asString();
        MerchOrder order = order(orderId);

        ResponseEntity<String> registration = postSignedWebhook(
                checkoutEvent("evt_registration", "checkout.session.completed", order, "paid", "registration"));
        ResponseEntity<String> noKind =
                postSignedWebhook(checkoutEvent("evt_nokind", "checkout.session.completed", order, "paid", null));

        assertThat(registration.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(noKind.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(order(orderId).getStatus()).isEqualTo(OrderStatus.AWAITING_PAYMENT);
        assertThat(mongoTemplate.count(new Query(), OrderStripeEvent.class)).isZero();
        assertThat(mailer.sent()).isEmpty();
    }

    @Test
    @Tag("#6007")
    void shouldWaitForTheMoneyWhenADelayedPaymentCompletesUnpaid() {
        Product harp = product("delayed", 4500, stock(SizeId.M, 5));
        String orderId = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 1)))
                .at("/orderId")
                .asString();

        postSignedWebhook(checkoutEvent("evt_unpaid", "checkout.session.completed", order(orderId), "unpaid", "order"));
        assertThat(order(orderId).getStatus()).isEqualTo(OrderStatus.AWAITING_PAYMENT);

        postSignedWebhook(checkoutEvent(
                "evt_async", "checkout.session.async_payment_succeeded", order(orderId), "paid", "order"));
        assertThat(order(orderId).getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    @Test
    @Tag("#6008")
    void shouldExpireTheOrderAndReleaseItsHoldsWhenThePaymentIsAbandonedOrFails() {
        Product harp = product("abandoned", 4500, stock(SizeId.M, 5, SizeId.L, 5));
        String expiredId = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 2)))
                .at("/orderId")
                .asString();
        String failedId = placed(orderJson("b@example.test", 0, line(harp, SizeId.L, 1)))
                .at("/orderId")
                .asString();

        ResponseEntity<String> expired = postSignedWebhook(
                checkoutEvent("evt_expired", "checkout.session.expired", order(expiredId), "unpaid", "order"));
        ResponseEntity<String> failed = postSignedWebhook(checkoutEvent(
                "evt_failed", "checkout.session.async_payment_failed", order(failedId), "unpaid", "order"));

        assertThat(expired.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(failed.getStatusCode()).isEqualTo(HttpStatus.OK);
        for (String id : List.of(expiredId, failedId)) {
            MerchOrder ended = order(id);
            assertThat(ended.getStatus()).isEqualTo(OrderStatus.EXPIRED);
            assertThat(ended.getPayment().getStatus()).isEqualTo(OrderPaymentStatus.FAILED);
            assertThat(ended.getExpiredAt()).isEqualTo(FIXED_NOW);
            assertThat(ended.getRetainUntil()).isEqualTo(FIXED_NOW.plus(Duration.ofDays(30)));
            assertThat(ended.getClientIp()).isNull();
            assertThat(ended.getHoldExpiresAt()).isNull();
        }
        assertThat(held(harp.getId(), SizeId.M)).isZero();
        assertThat(held(harp.getId(), SizeId.L)).isZero();
        assertThat(stockOf(harp.getId(), SizeId.M)).isEqualTo(5);
        assertThat(shopPaymentGateway.refunds()).isEmpty();
        assertThat(mailer.sent()).isEmpty();
    }

    @Test
    @Tag("#6009")
    void shouldConfirmALatePaymentWhenTheStockCanBeRetaken() {
        Product harp = product("late-stock", 4500, stock(SizeId.M, 2));
        String orderId = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 2)))
                .at("/orderId")
                .asString();
        postSignedWebhook(checkoutEvent("evt_exp", "checkout.session.expired", order(orderId), "unpaid", "order"));

        postSignedWebhook(paidEvent("evt_late", order(orderId)));

        assertThat(order(orderId).getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(stockOf(harp.getId(), SizeId.M)).isZero();
        assertThat(held(harp.getId(), SizeId.M)).isZero();
        assertThat(shopPaymentGateway.refunds()).isEmpty();
        assertThat(mailer.awaitSent(1).getFirst().subject()).contains("confirmed");
    }

    @Test
    @Tag("#6009")
    void shouldRefundALatePaymentInFullWhenTheStockIsGone() {
        Product harp = product("late-gone", 4500, stock(SizeId.M, 1));
        String lateId = placed(orderJson("late@example.test", 0, line(harp, SizeId.M, 1)))
                .at("/orderId")
                .asString();
        postSignedWebhook(checkoutEvent("evt_exp", "checkout.session.expired", order(lateId), "unpaid", "order"));
        String otherId = placed(orderJson("quick@example.test", 0, line(harp, SizeId.M, 1)))
                .at("/orderId")
                .asString();
        pay(otherId);
        mailer.reset();

        ResponseEntity<String> response = postSignedWebhook(paidEvent("evt_late", order(lateId)));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        MerchOrder refunded = order(lateId);
        assertThat(refunded.getStatus()).isEqualTo(OrderStatus.REFUNDED);
        assertThat(refunded.getPayment().getStatus()).isEqualTo(OrderPaymentStatus.PAID);
        assertThat(refunded.getRefund().getStatus()).isEqualTo(OrderRefundStatus.REFUNDED);
        assertThat(refunded.getRefund().getAmountCents()).isEqualTo(4500);
        assertThat(refunded.getRefundedAt()).isEqualTo(FIXED_NOW);
        assertThat(refunded.getAccessKey()).isNull();
        assertThat(shopPaymentGateway.refunds()).singleElement().satisfies(refund -> {
            assertThat(refund.paymentIntentId()).isEqualTo("pi_test_" + lateId);
            assertThat(refund.amountCents()).isEqualTo(4500);
            assertThat(refund.idempotencyKey()).isEqualTo("order-refund-" + lateId + "-1");
        });
        assertThat(stockOf(harp.getId(), SizeId.M)).isZero();
        MailMessage mail = mailer.awaitSent(1).getFirst();
        assertThat(mail.to()).isEqualTo("late@example.test");
        assertThat(mail.body()).contains("full refund of €45.00");
    }

    @Test
    @Tag("#6009")
    void shouldAnswerAnErrorAndApplyTheEventOnStripesRetryWhenTheRefundFails() {
        Product harp = product("retry", 4500, stock(SizeId.M, 1));
        String lateId = placed(orderJson("late@example.test", 0, line(harp, SizeId.M, 1)))
                .at("/orderId")
                .asString();
        postSignedWebhook(checkoutEvent("evt_exp", "checkout.session.expired", order(lateId), "unpaid", "order"));
        pay(placed(orderJson("quick@example.test", 0, line(harp, SizeId.M, 1)))
                .at("/orderId")
                .asString());
        shopPaymentGateway.failRefunds(1);
        String payload = paidEvent("evt_late", order(lateId));

        ResponseEntity<String> first = postSignedWebhook(payload);

        assertThat(first.getStatusCode().is5xxServerError()).isTrue();
        assertThat(mongoTemplate.findById("evt_late", OrderStripeEvent.class).isHandled())
                .isFalse();
        assertThat(order(lateId).getRefund().getStatus()).isEqualTo(OrderRefundStatus.FAILED);
        // ADR-0018: a refund was tried, so the order is never confirmed and needs no key.
        assertThat(order(lateId).getAccessKey()).isNull();

        ResponseEntity<String> retry = postSignedWebhook(payload);

        assertThat(retry.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(order(lateId).getStatus()).isEqualTo(OrderStatus.REFUNDED);
        assertThat(order(lateId).getRefund().getStatus()).isEqualTo(OrderRefundStatus.REFUNDED);
        assertThat(shopPaymentGateway.refunds()).hasSize(1);
        assertThat(mongoTemplate.findById("evt_late", OrderStripeEvent.class).isHandled())
                .isTrue();
    }

    @Test
    void shouldShowTheNewAvailabilityOnTheNextPublicReadAfterAnOrderChangesIt() {
        Product harp = product("fresh", 4500, stock(SizeId.M, 3));
        String path = ApiRoutes.PRODUCT + "/fresh";
        assertThat(available(restTemplate.getForEntity(path, String.class))).isEqualTo(3);

        String orderId = placed(orderJson("a@example.test", 0, line(harp, SizeId.M, 2)))
                .at("/orderId")
                .asString();
        assertThat(available(restTemplate.getForEntity(path, String.class))).isEqualTo(1);

        postSignedWebhook(checkoutEvent("evt_exp", "checkout.session.expired", order(orderId), "unpaid", "order"));
        assertThat(available(restTemplate.getForEntity(path, String.class))).isEqualTo(3);
    }

    private int available(ResponseEntity<String> productPage) {
        return json(productPage).at("/sizes/0/available").asInt();
    }
}
