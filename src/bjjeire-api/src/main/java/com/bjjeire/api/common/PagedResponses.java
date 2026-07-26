package com.bjjeire.api.common;

import java.util.List;
import org.springframework.util.MultiValueMap;

public final class PagedResponses {
    private PagedResponses() {}

    public static <T> PagedResponse<T> of(List<T> items, PaginationRequest request, long totalItems) {
        int totalPages = (int) Math.ceil((double) totalItems / request.pageSize());
        return new PagedResponse<>(
                items,
                new PaginationMetadata(
                        totalItems,
                        request.page(),
                        request.pageSize(),
                        totalPages,
                        request.page() < totalPages,
                        request.page() > 1,
                        null,
                        null));
    }

    public static <T> PagedResponse<T> withNavigationLinks(
            PagedResponse<T> cached, UriService uriService, String basePath) {
        return withNavigationLinks(cached, uriService, basePath, null);
    }

    public static <T> PagedResponse<T> withNavigationLinks(
            PagedResponse<T> cached, UriService uriService, String basePath, MultiValueMap<String, String> filters) {
        PaginationMetadata meta = cached.pagination();
        return new PagedResponse<>(
                cached.data(),
                new PaginationMetadata(
                        meta.totalItems(),
                        meta.currentPage(),
                        meta.pageSize(),
                        meta.totalPages(),
                        meta.hasNextPage(),
                        meta.hasPreviousPage(),
                        meta.hasNextPage()
                                ? uriService.pageUri(basePath, meta.currentPage() + 1, meta.pageSize(), filters)
                                : null,
                        meta.hasPreviousPage()
                                ? uriService.pageUri(basePath, meta.currentPage() - 1, meta.pageSize(), filters)
                                : null));
    }
}
