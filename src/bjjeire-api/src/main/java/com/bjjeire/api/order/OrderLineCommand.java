package com.bjjeire.api.order;

import com.bjjeire.api.common.ValidObjectId;
import com.bjjeire.api.product.SizeId;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * One basket line. Up to 10 units of a line and 20 in an order (409 {@code basket-too-large}).
 *
 * @param unitPriceCents the price the shopper was shown; a different current price is 409 {@code basket-changed}
 *     (#6010), so nobody is charged a price they did not see
 */
public record OrderLineCommand(
        @NotBlank @ValidObjectId String productId,
        @NotNull SizeId sizeId,
        @NotNull @Min(1) Integer quantity,
        @NotNull @Min(0) Integer unitPriceCents) {}
