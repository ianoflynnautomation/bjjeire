package com.bjjeire.api.product;

/** Where a product is in its life. Only {@link #PUBLISHED} is shown or sold (FR-006). */
public enum ProductStatus {
    DRAFT,
    PUBLISHED,
    HIDDEN;

    /**
     * Tells whether a product in this status may move to another (data-model.md § State transitions).
     *
     * @param target the status asked for
     * @return true for draft or hidden to published, and published to hidden
     */
    public boolean canBecome(ProductStatus target) {
        return switch (this) {
            case DRAFT, HIDDEN -> target == PUBLISHED;
            case PUBLISHED -> target == HIDDEN;
        };
    }
}
