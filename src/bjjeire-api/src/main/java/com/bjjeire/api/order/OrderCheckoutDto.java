package com.bjjeire.api.order;

import java.time.Instant;

/**
 * Where to send the guest to pay.
 *
 * @param orderKey the order's access key, returned once when the order is made and never again; the order page sends it
 *     as {@code X-Order-Key}. Absent when an open checkout is resumed
 * @param checkoutUrl the hosted Stripe Checkout page
 * @param holdExpiresAt the stock is released at this instant unless paid
 * @param totalCents items plus delivery, in euro cents
 */
public record OrderCheckoutDto(
        String orderId, String orderKey, String checkoutUrl, Instant holdExpiresAt, int totalCents) {}
