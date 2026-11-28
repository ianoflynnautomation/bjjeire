package com.bjjeire.api.order;

import java.util.Optional;

/** Guest orders and what Stripe reports about them (User Story 3). */
public interface OrderService {

    /** The flat delivery fee and where BJJ Éire delivers (#6006). */
    ShopDeliveryDto getDelivery();

    /**
     * Holds the basket's stock and opens a Stripe Checkout for a guest (#6005, #6006, #6012).
     *
     * @param clientIp the caller's address, for the unpaid-orders limit (research R7)
     * @return the order's id, its access key (this once) and the Checkout page
     */
    OrderCheckoutDto create(CreateOrderCommand command, String clientIp);

    /** The order, when {@code key} is its access key; empty otherwise, as for an unknown id (#6011, FR-015). */
    Optional<OrderDto> getWithKey(String id, String key);

    /** The order's open Checkout page again, while its hold lasts (#6008). */
    OrderCheckoutDto resumeCheckout(String id, String key);

    /** A signed, paid Checkout Session: confirms the order, or refunds a late one with no stock left (#6007, #6009). */
    void onCheckoutPaid(String orderId, String checkoutSessionId, String paymentIntentId);

    /** A Checkout Session that closed unpaid: the order expires and its stock goes back (#6008). */
    void onCheckoutExpired(String orderId, String checkoutSessionId);

    /** Stripe's report on an order's refund: {@code succeeded}, {@code pending}, {@code failed} or {@code canceled}. */
    void onRefundUpdated(String orderId, String refundId, String status, String failureReason);

    /**
     * Ends unpaid holds whose Checkout has closed, for a missed expiry event (FR-011).
     *
     * @return how many orders expired
     */
    int expireLapsedHolds();
}
