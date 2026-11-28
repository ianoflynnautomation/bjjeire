package com.bjjeire.api.order;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/** One guest's purchase of BJJ Éire merch (specs/database-contracts/merch-order.md). */
@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Document(MerchOrder.ENTITY_NAME)
public class MerchOrder {
    public static final String ENTITY_NAME = "MerchOrder";
    public static final String CURRENCY = "EUR";

    @Id
    private String id;

    /** {@code BJE-<yyyymmdd>-<6 base32>}, the Irish date it was made. Unique. */
    private String number;

    /** SHA-256 hex of the access key in the order's link (research R6). Never returned by any route. */
    private String accessKeyHash;

    /**
     * The access key itself, kept only until the confirmation mail is built from it (ADR-0018). Removed when the order
     * is confirmed or refunded; an expired order keeps it, because a late payment can still confirm it, and is deleted
     * 30 days later. Never returned by any route.
     */
    private String accessKey;

    private OrderStatus status;

    @Builder.Default
    private List<OrderLine> lines = new ArrayList<>();

    private int itemsCents;

    /** The delivery fee when the order was made (FR-017). */
    private int deliveryCents;

    private int totalCents;

    @Builder.Default
    private String currency = CURRENCY;

    /** Lower-cased. Personal data. */
    private String email;

    private DeliveryAddress address;

    /** Set while {@code AWAITING_PAYMENT}. */
    private Instant holdExpiresAt;

    private OrderPayment payment;
    private OrderRefund refund;
    private OrderDispatch dispatch;

    @Field("createdAt")
    private Instant createdOnUtc;

    private Instant expiredAt;

    /** When the refund completed. */
    private Instant refundedAt;

    /** Kept only while {@code AWAITING_PAYMENT}, for the unpaid-orders limit (research R7). */
    private String clientIp;

    /**
     * Which of the email's unpaid places this order holds, 0 to 2, while {@code AWAITING_PAYMENT} (research R7). The
     * partial unique index {@code ux_order_unpaid_email_slot} makes the limit exact under concurrency, as
     * registration's {@code unpaidSlot} does. Removed on any change of state, which frees the place.
     */
    private Integer emailSlot;

    /** The same for the client address ({@code ux_order_unpaid_ip_slot}); null when the address is unknown. */
    private Integer ipSlot;

    /** The TTL index removes the order then: {@code paidAt} + 6 years, or {@code expiredAt} + 30 days (R11). */
    private Instant retainUntil;
}
