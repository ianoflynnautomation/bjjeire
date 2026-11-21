package com.bjjeire.api.product;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** A size and the stock the organiser sets for it. */
public record SizeStockDto(
        @NotNull SizeId id, @NotNull @Min(0) @Max(100_000) Integer stock) {}
