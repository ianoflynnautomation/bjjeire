package com.bjjeire.api.product;

import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/** The product rules in data-model.md § Product. Pure: no MongoDB, no clock. */
public final class ProductRules {
    /** Most photos a product may show (research R4). */
    public static final int MAX_PHOTOS = 6;

    /** Largest photo the organiser may upload, in bytes: 5 MB (research R4). */
    public static final int MAX_PHOTO_BYTES = 5 * 1024 * 1024;

    private ProductRules() {}

    /**
     * Refuses a product that cannot be shown to visitors.
     *
     * @throws org.springframework.web.server.ResponseStatusException 409 product-not-publishable with no photo, more
     *     than {@link #MAX_PHOTOS}, or no size
     */
    public static void requirePublishable(List<String> photos, List<ProductSize> sizes) {
        int photoCount = photos == null ? 0 : photos.size();
        if (photoCount == 0 || photoCount > MAX_PHOTOS) {
            throw ApiProblems.conflict(
                    ProblemTypes.PRODUCT_NOT_PUBLISHABLE,
                    "A product needs between 1 and " + MAX_PHOTOS + " photos before visitors can see it.");
        }
        if (sizes == null || sizes.isEmpty()) {
            throw ApiProblems.conflict(
                    ProblemTypes.PRODUCT_NOT_PUBLISHABLE,
                    "A product needs at least one size before visitors can see it.");
        }
    }

    /**
     * Refuses a size list that names a size twice.
     *
     * @throws org.springframework.web.server.ResponseStatusException 400 on field {@code Sizes}, code
     *     {@code DUPLICATE_SIZE}
     */
    public static void requireUniqueSizes(Collection<SizeId> sizes) {
        Set<SizeId> seen = EnumSet.noneOf(SizeId.class);
        for (SizeId size : sizes) {
            if (!seen.add(size)) {
                throw ApiProblems.validation("Sizes", "Size " + size + " is listed more than once.", "DUPLICATE_SIZE");
            }
        }
    }

    /**
     * Refuses a stock count lower than what unpaid checkouts already hold of the size.
     *
     * @throws org.springframework.web.server.ResponseStatusException 409 stock-below-held naming the size and the
     *     number held
     */
    public static void requireStockCoversHeld(SizeId size, int stock, int held) {
        if (stock < held) {
            throw ApiProblems.conflict(
                    ProblemTypes.STOCK_BELOW_HELD,
                    "Size " + size + " has " + held + " held in unpaid checkouts. Set its stock to at least " + held
                            + ", or wait for those checkouts to finish.");
        }
    }

    /** The sizes in display order, XS first. */
    public static List<ProductSize> ordered(List<ProductSize> sizes) {
        return sizes.stream().sorted(Comparator.comparing(ProductSize::getId)).toList();
    }

    /** What a shopper can still buy of a size: on the shelf and not held. Never below zero. */
    public static int available(ProductSize size) {
        return Math.max(0, size.getStock() - size.getHeld());
    }

    public static boolean soldOut(ProductSize size) {
        return available(size) == 0;
    }

    /** A product is out of stock when no size of it can be bought. */
    public static boolean soldOut(List<ProductSize> sizes) {
        return sizes == null || sizes.stream().allMatch(ProductRules::soldOut);
    }
}
