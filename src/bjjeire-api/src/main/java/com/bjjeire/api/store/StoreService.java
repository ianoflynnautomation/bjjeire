package com.bjjeire.api.store;

import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;

/** Use cases for stores. Controllers depend on this type, not the Mongo implementation. */
public interface StoreService {
    /**
     * Lists active stores.
     *
     * @param paginationRequest page and page size
     * @param basePath path used to build page links
     * @return the page, with navigation links
     */
    PagedResponse<StoreDto> getAll(PaginationRequest paginationRequest, String basePath);
}
