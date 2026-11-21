package com.bjjeire.api.product;

/**
 * A product as the merch section shows it (#6001). {@code photo} is the first photo's hash, or null for none; it is
 * served at {@code /api/v1/product/photo/{photo}}.
 */
public record ProductSummaryDto(
        String id,
        String slug,
        String name,
        ProductKind kind,
        int priceCents,
        String currency,
        String photo,
        boolean soldOut) {}
