package com.bjjeire.api.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.order.ShopPaymentGateway.ShopCheckoutRequest;
import com.bjjeire.api.order.ShopPaymentGateway.ShopLineItem;
import com.bjjeire.api.order.ShopPaymentGateway.ShopRefundRequest;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/** The Checkout Session and Refund the shop asks Stripe for (research R1, R3, ADR-0016). */
class StripeShopPaymentGatewayTest {
    private static final ShopCheckoutRequest REQUEST = new ShopCheckoutRequest(
            "order1",
            "BJE-20260531-ABCDEF",
            List.of(new ShopLineItem("Harp Rashguard — M", 4500, 2), new ShopLineItem("Harp Tee — L", 2500, 1)),
            650,
            "EUR",
            "aoife@example.test",
            new DeliveryAddressDto(
                    "Aoife Byrne", "1 Shop Street", "Flat 2", "Galway", "Galway", "H91 E2K3", "IE", "+353 91 000 000"),
            Instant.parse("2026-05-31T00:32:00Z"),
            "https://bjjeire.test/shop/orders/order1?checkout=complete",
            "https://bjjeire.test/shop/orders/order1?checkout=cancelled",
            "order-checkout-order1-1");

    @Test
    @Tag("#6006")
    void shouldChargeEachLineAtTheShopsPricePlusOneDeliveryLine() {
        SessionCreateParams params = StripeShopPaymentGateway.checkoutParams(REQUEST);

        assertThat(params.getMode()).isEqualTo(SessionCreateParams.Mode.PAYMENT);
        assertThat(params.getLineItems()).hasSize(3);
        assertThat(params.getLineItems())
                .extracting(item -> item.getPriceData().getProductData().getName())
                .containsExactly("Harp Rashguard — M", "Harp Tee — L", "Delivery (Ireland and Northern Ireland)");
        assertThat(params.getLineItems())
                .extracting(item -> item.getPriceData().getUnitAmount())
                .containsExactly(4500L, 2500L, 650L);
        assertThat(params.getLineItems())
                .extracting(SessionCreateParams.LineItem::getQuantity)
                .containsExactly(2L, 1L, 1L);
        assertThat(params.getLineItems())
                .allSatisfy(
                        item -> assertThat(item.getPriceData().getCurrency()).isEqualTo("eur"));
        assertThat(params.getCustomerEmail()).isEqualTo("aoife@example.test");
        assertThat(params.getExpiresAt())
                .isEqualTo(Instant.parse("2026-05-31T00:32:00Z").getEpochSecond());
    }

    @Test
    void shouldLeaveOutTheDeliveryLineWhenDeliveryIsFree() {
        ShopCheckoutRequest free = new ShopCheckoutRequest(
                REQUEST.orderId(),
                REQUEST.number(),
                REQUEST.lines(),
                0,
                "EUR",
                REQUEST.customerEmail(),
                REQUEST.address(),
                REQUEST.expiresAt(),
                REQUEST.successUrl(),
                REQUEST.cancelUrl(),
                REQUEST.idempotencyKey());

        assertThat(StripeShopPaymentGateway.checkoutParams(free).getLineItems()).hasSize(2);
    }

    @Test
    @Tag("#6007")
    void shouldMarkTheSessionAndItsPaymentAsAnOrder() {
        SessionCreateParams params = StripeShopPaymentGateway.checkoutParams(REQUEST);

        assertThat(params.getClientReferenceId()).isEqualTo("order1");
        assertThat(params.getMetadata()).containsEntry("bjjeireKind", "order").containsEntry("orderId", "order1");
        assertThat(params.getPaymentIntentData().getMetadata())
                .containsEntry("bjjeireKind", "order")
                .containsEntry("orderId", "order1");
        assertThat(params.getPaymentIntentData().getDescription()).isEqualTo("BJJ Éire order BJE-20260531-ABCDEF");
    }

    @Test
    @Tag("#6006")
    void shouldPassTheCheckedAddressAsTheShippingAddress() {
        SessionCreateParams.PaymentIntentData.Shipping shipping = StripeShopPaymentGateway.checkoutParams(REQUEST)
                .getPaymentIntentData()
                .getShipping();

        assertThat(shipping.getName()).isEqualTo("Aoife Byrne");
        assertThat(shipping.getPhone()).isEqualTo("+353 91 000 000");
        assertThat(shipping.getAddress().getLine1()).isEqualTo("1 Shop Street");
        assertThat(shipping.getAddress().getLine2()).isEqualTo("Flat 2");
        assertThat(shipping.getAddress().getCity()).isEqualTo("Galway");
        assertThat(shipping.getAddress().getState()).isEqualTo("Galway");
        assertThat(shipping.getAddress().getPostalCode()).isEqualTo("H91 E2K3");
        assertThat(shipping.getAddress().getCountry()).isEqualTo("IE");
    }

    @Test
    void shouldMarkEveryRefundAsAnOrder() {
        RefundCreateParams params = StripeShopPaymentGateway.refundParams(
                new ShopRefundRequest("order1", "pi_1", 5150, "order-refund-order1-1"));

        assertThat(params.getPaymentIntent()).isEqualTo("pi_1");
        assertThat(params.getAmount()).isEqualTo(5150L);
        assertThat(params.getMetadata())
                .asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.MAP)
                .containsEntry("bjjeireKind", "order")
                .containsEntry("orderId", "order1");
    }
}
