package com.bjjeire.api.order;

import com.bjjeire.api.product.ProductKind;
import com.bjjeire.api.product.SizeId;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One product and size in an order. The product's name, kind, price and photo are copied when the order is made, so a
 * later edit never changes a past order (FR-007, #6015).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderLine {
    private String productId;
    private String productName;
    private ProductKind kind;
    private SizeId sizeId;
    private int quantity;
    private int unitPriceCents;

    /** The first photo's hash when the order was made, or null. */
    private String photo;

    public int lineCents() {
        return quantity * unitPriceCents;
    }
}
