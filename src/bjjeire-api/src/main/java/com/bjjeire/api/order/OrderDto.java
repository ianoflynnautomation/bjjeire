package com.bjjeire.api.order;

import java.time.Instant;
import java.util.List;

/**
 * An order as its guest sees it from the link in their mail (#6011, FR-015). Never the access key or its hash.
 *
 * @param refundStatus set once a refund was asked for: {@code PENDING} shows as "refund pending"
 */
public record OrderDto(
        String id,
        String number,
        OrderStatus status,
        List<OrderLineDto> lines,
        int itemsCents,
        int deliveryCents,
        int totalCents,
        String currency,
        String email,
        DeliveryAddressDto address,
        Instant createdAt,
        Instant holdExpiresAt,
        Instant paidAt,
        OrderDispatchDto dispatch,
        OrderRefundStatus refundStatus) {}
