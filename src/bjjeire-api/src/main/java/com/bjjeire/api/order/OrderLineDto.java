package com.bjjeire.api.order;

import com.bjjeire.api.product.ProductKind;
import com.bjjeire.api.product.SizeId;

/** One line of an order as it was bought (#6011). */
public record OrderLineDto(
        String productId,
        String productName,
        ProductKind kind,
        SizeId sizeId,
        int quantity,
        int unitPriceCents,
        int lineCents,
        String photo) {}
