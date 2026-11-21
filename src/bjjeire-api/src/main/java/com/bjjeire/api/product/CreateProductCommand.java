package com.bjjeire.api.product;

import static com.bjjeire.api.product.ProductDetails.SLUG_MESSAGE;
import static com.bjjeire.api.product.ProductDetails.SLUG_PATTERN;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/** A new product, stored as a draft (#6013). Photos are added after it is saved. */
public record CreateProductCommand(
        @NotBlank @Size(min = 3, max = 60) @Pattern(regexp = SLUG_PATTERN, message = SLUG_MESSAGE) String slug,

        @NotBlank @Size(max = 80) String name,
        @NotNull ProductKind kind,
        @NotBlank @Size(max = 2000) String description,
        @NotNull @Min(100) @Max(100_000) Integer priceCents,
        @NotNull @Size(min = 1, max = 6) List<@NotNull @Valid SizeStockDto> sizes) {}
