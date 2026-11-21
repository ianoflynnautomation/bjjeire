package com.bjjeire.api.product;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/** A BJJ Éire merch item for sale (specs/database-contracts/product.md). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(Product.ENTITY_NAME)
public class Product {
    public static final String ENTITY_NAME = "Product";
    public static final String CURRENCY = "EUR";

    @Id
    private String id;

    /**
     * Counts organiser writes. An edit names the version it was made from and is refused when another write came first.
     * Kept by hand, not {@code @Version}: every write is a guarded {@code findAndModify}.
     */
    private Long version;

    private String slug;
    private String name;
    private ProductKind kind;
    private String description;

    /** Price including VAT, in cents. */
    private int priceCents;

    @Builder.Default
    private String currency = CURRENCY;

    /** SHA-256 hex of each photo in the {@code productPhotos} GridFS bucket, in display order. */
    @Builder.Default
    private List<String> photos = new ArrayList<>();

    /** One entry per size, in {@link SizeId} order. */
    @Builder.Default
    private List<ProductSize> sizes = new ArrayList<>();

    @Builder.Default
    private ProductStatus status = ProductStatus.DRAFT;

    @Field("createdAt")
    private Instant createdOnUtc;

    @Field("createdBy")
    private String createdBy;

    @Field("updatedAt")
    private Instant updatedOnUtc;

    @Field("updatedBy")
    private String updatedBy;
}
