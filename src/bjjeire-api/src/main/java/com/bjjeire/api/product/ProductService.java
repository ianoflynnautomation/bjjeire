package com.bjjeire.api.product;

import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** BJJ Éire merch products: the public catalogue and the organiser's product admin (User Stories 2 and 4). */
public interface ProductService {

    /** Published products, by kind then name (#6001, #6003). */
    PagedResponse<ProductSummaryDto> getPublished(PaginationRequest paginationRequest, String basePath);

    /** A published product's page; empty for a draft, a hidden product or an unknown slug (#6002). */
    Optional<ProductDto> getPublishedBySlug(String slug);

    /**
     * The products a checkout names, in any status, read fresh rather than from the cache (#6010). Ids that name no
     * product are left out.
     */
    List<ProductOffer> getOffers(Collection<String> ids);

    /** A stored photo; empty when none has this hash. */
    Optional<ProductPhoto> getPhoto(String sha256);

    /** Every product in any status, for the organiser (#6013). */
    PagedResponse<AdminProductDto> getAllForAdmin(PaginationRequest paginationRequest, String basePath);

    Optional<AdminProductDto> getForAdmin(String id);

    /** Stores a new product as a draft (#6013). */
    AdminProductDto create(CreateProductCommand command);

    /** Replaces the details, sizes and photo order; a price change applies to new checkouts only (#6015). */
    Optional<AdminProductDto> update(String id, UpdateProductCommand command);

    /** Shows a draft or hidden product to visitors (#6014). */
    Optional<AdminProductDto> publish(String id);

    /** Takes a published product off sale (#6014). Hiding a hidden product returns it unchanged. */
    Optional<AdminProductDto> hide(String id);

    /** Sets the stock of the sizes named (#6016). */
    Optional<AdminProductDto> setStock(String id, StockCommand command);

    /**
     * Adds a photo to the end of the product's photos.
     *
     * @return the photo's SHA-256 hex, or empty when the product does not exist
     */
    Optional<String> addPhoto(String id, byte[] content);

    /**
     * Deletes a draft and the photos no other product names.
     *
     * @return false when the product does not exist
     */
    boolean delete(String id);
}
