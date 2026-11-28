package com.bjjeire.api.order;

import java.util.List;

/**
 * The flat delivery fee and where BJJ Éire delivers (#6006, FR-017).
 *
 * @param countries {@code IE} and {@code GB-NIR} (Northern Ireland)
 */
public record ShopDeliveryDto(int deliveryFeeCents, String currency, List<String> countries) {}
