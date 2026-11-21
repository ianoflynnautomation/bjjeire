package com.bjjeire.api.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Sets the stock of the sizes named; sizes left out keep theirs (#6016). */
public record StockCommand(
        @NotNull @Size(min = 1, max = 6) List<@NotNull @Valid SizeStockDto> sizes,
        @NotNull Long version) {}
