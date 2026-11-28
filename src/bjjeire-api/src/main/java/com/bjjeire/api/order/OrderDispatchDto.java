package com.bjjeire.api.order;

import java.time.Instant;

/** When the order was sent, and its tracking reference if the organiser gave one. */
public record OrderDispatchDto(Instant dispatchedAt, String trackingReference) {}
