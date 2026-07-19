package com.bjjeire.api.common;

public record PaginationRequest(int page, int pageSize) {
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    public PaginationRequest {
        page = page > 0 ? page : DEFAULT_PAGE;
        pageSize = pageSize > 0 && pageSize <= MAX_PAGE_SIZE ? pageSize : DEFAULT_PAGE_SIZE;
    }
}
