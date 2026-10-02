package com.bjjeire.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

public record PaginationMetadata(
        long totalItems,
        int currentPage,
        int pageSize,
        int totalPages,
        boolean hasNextPage,
        boolean hasPreviousPage,

        @JsonInclude(JsonInclude.Include.ALWAYS) @Schema(types = {"string", "null"})
        String nextPageUrl,

        @JsonInclude(JsonInclude.Include.ALWAYS) @Schema(types = {"string", "null"})
        String previousPageUrl) {}
