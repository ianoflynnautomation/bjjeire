package com.bjjeire.api.common;

public record PaginationMetadata(
        long totalItems,
        int currentPage,
        int pageSize,
        int totalPages,
        boolean hasNextPage,
        boolean hasPreviousPage,
        String nextPageUrl,
        String previousPageUrl) {}
