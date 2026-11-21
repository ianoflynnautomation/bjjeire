package com.bjjeire.api.product;

import java.util.List;

/** A published product's page (#6002). Sizes are in display order, XS first; sold-out sizes are listed too. */
public record ProductDto(
        String id,
        String slug,
        String name,
        ProductKind kind,
        String description,
        int priceCents,
        String currency,
        List<String> photos,
        List<ProductSizeDto> sizes,
        boolean soldOut) {}
