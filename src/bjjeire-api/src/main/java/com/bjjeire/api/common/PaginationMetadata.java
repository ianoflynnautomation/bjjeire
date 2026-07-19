package com.bjjeire.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;

public record PaginationMetadata(
        long totalItems,
        int currentPage,
        int pageSize,
        int totalPages,
        boolean hasNextPage,
        boolean hasPreviousPage,
        @JsonInclude(JsonInclude.Include.ALWAYS) String nextPageUrl,
        @JsonInclude(JsonInclude.Include.ALWAYS) String previousPageUrl) {}
