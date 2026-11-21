package com.bjjeire.api.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One size of a product, embedded in {@link Product}. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSize {
    private SizeId id;

    /** On the shelf and not yet sold. Set by the organiser. */
    private int stock;

    /** In unpaid checkouts. Only the order flow changes it; organiser writes keep it as it is. */
    private int held;
}
