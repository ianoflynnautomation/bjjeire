package com.bjjeire.api.product;

import java.time.Instant;
import java.util.List;

/** A product in any status, for the organiser. Send {@code version} back with the next edit. */
public record AdminProductDto(
        String id,
        String slug,
        String name,
        ProductKind kind,
        String description,
        int priceCents,
        String currency,
        List<String> photos,
        List<AdminProductSizeDto> sizes,
        ProductStatus status,
        Long version,
        Instant createdOnUtc,
        Instant updatedOnUtc) {}
