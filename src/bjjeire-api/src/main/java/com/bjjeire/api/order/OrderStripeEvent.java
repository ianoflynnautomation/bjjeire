package com.bjjeire.api.order;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * The shop webhook's idempotency ledger, separate from registration's {@code StripeEvent}: Stripe sends one event id to
 * both endpoints (research R2). Removed by {@code ttl_orderStripeEvent_expiresAt} after 30 days.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(OrderStripeEvent.ENTITY_NAME)
public class OrderStripeEvent {
    public static final String ENTITY_NAME = "OrderStripeEvent";

    @Id
    private String id;

    private String type;
    private Instant receivedAt;
    private Instant expiresAt;

    /** Set once the event has been applied; an unhandled entry is applied again on Stripe's retry. */
    private boolean handled;
}
