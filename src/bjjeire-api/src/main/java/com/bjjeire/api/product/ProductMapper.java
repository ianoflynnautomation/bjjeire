package com.bjjeire.api.product;

import java.util.List;

/** Product documents to their wire shapes. A visitor never sees {@code stock} or {@code held} (#6002). */
public final class ProductMapper {
    private ProductMapper() {}

    public static ProductSummaryDto toSummary(Product product) {
        return new ProductSummaryDto(
                product.getId(),
                product.getSlug(),
                product.getName(),
                product.getKind(),
                product.getPriceCents(),
                product.getCurrency(),
                photos(product).isEmpty() ? null : photos(product).get(0),
                ProductRules.soldOut(sizes(product)));
    }

    public static ProductDto toDto(Product product) {
        return new ProductDto(
                product.getId(),
                product.getSlug(),
                product.getName(),
                product.getKind(),
                product.getDescription(),
                product.getPriceCents(),
                product.getCurrency(),
                List.copyOf(photos(product)),
                ProductRules.ordered(sizes(product)).stream()
                        .map(size -> new ProductSizeDto(
                                size.getId(), ProductRules.available(size), ProductRules.soldOut(size)))
                        .toList(),
                ProductRules.soldOut(sizes(product)));
    }

    public static AdminProductDto toAdminDto(Product product) {
        return new AdminProductDto(
                product.getId(),
                product.getSlug(),
                product.getName(),
                product.getKind(),
                product.getDescription(),
                product.getPriceCents(),
                product.getCurrency(),
                List.copyOf(photos(product)),
                ProductRules.ordered(sizes(product)).stream()
                        .map(size -> new AdminProductSizeDto(
                                size.getId(),
                                size.getStock(),
                                size.getHeld(),
                                ProductRules.available(size),
                                ProductRules.soldOut(size)))
                        .toList(),
                product.getStatus(),
                product.getVersion(),
                product.getCreatedOnUtc(),
                product.getUpdatedOnUtc());
    }

    private static List<String> photos(Product product) {
        return product.getPhotos() == null ? List.of() : product.getPhotos();
    }

    private static List<ProductSize> sizes(Product product) {
        return product.getSizes() == null ? List.of() : product.getSizes();
    }
}
