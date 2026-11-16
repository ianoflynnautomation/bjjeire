package com.bjjeire.api.registration;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Webhook idempotency ledger: the Stripe event id is the {@code _id}, so a redelivery of a handled event is
 * acknowledged without being applied again (SC-004). Removed by the {@code ttl_stripeEvent_expiresAt} index after 30
 * days.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(StripeEvent.ENTITY_NAME)
public class StripeEvent {
    public static final String ENTITY_NAME = "StripeEvent";

    @Id
    private String id;

    private String type;
    private Instant receivedAt;
    private Instant expiresAt;

    /**
     * Set once the event has been applied. An entry left unhandled by a pod that died part way is applied again on
     * Stripe's retry; every handler is guarded on the sign-up's status, so applying twice changes nothing.
     */
    private boolean handled;
}
