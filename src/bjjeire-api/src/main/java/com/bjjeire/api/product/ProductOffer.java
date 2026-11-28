package com.bjjeire.api.product;

import java.util.Map;

/**
 * A product as a checkout sees it, read fresh from the database: what it costs now, whether it is on sale and how many
 * of each size can be held. Not a wire shape.
 *
 * @param onSale true only while the product is published (FR-006)
 * @param photo the first photo's hash, or null
 * @param available {@code stock - held} for each size the product comes in
 */
public record ProductOffer(
        String id,
        String name,
        ProductKind kind,
        int priceCents,
        boolean onSale,
        String photo,
        Map<SizeId, Integer> available) {}
