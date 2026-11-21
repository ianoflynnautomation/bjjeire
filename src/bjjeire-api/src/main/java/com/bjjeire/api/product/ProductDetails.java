package com.bjjeire.api.product;

/** The limits a product's fields share between create and update (data-model.md § Product). */
public final class ProductDetails {
    /** Lowercase words joined by hyphens. {@code admin} and {@code photo} would clash with routes under the prefix. */
    public static final String SLUG_PATTERN = "^(?!(?:admin|photo)$)[a-z0-9]+(?:-[a-z0-9]+)*$";

    public static final String SLUG_MESSAGE =
            "must be lowercase letters, digits and hyphens, and must not be 'admin' or 'photo'";

    public static final String PHOTO_PATTERN = "^[0-9a-f]{64}$";

    private ProductDetails() {}
}
