package com.bjjeire.api.order;

import com.bjjeire.api.product.SizeId;

/**
 * One basket line that changed, listed in the {@code lines} of a 409 {@code basket-changed} (#6010).
 *
 * @param nowAvailable how many can be bought now, for {@code SOLD_OUT}
 * @param nowPriceCents the current price, for {@code PRICE_CHANGED}
 */
public record BasketChangeDto(
        String productId, SizeId sizeId, BasketChangeReason reason, Integer nowAvailable, Integer nowPriceCents) {}
