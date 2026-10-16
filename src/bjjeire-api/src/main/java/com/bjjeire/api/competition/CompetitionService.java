package com.bjjeire.api.competition;

import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;

/** Use cases for competitions. Controllers depend on this type, not the Mongo implementation. */
public interface CompetitionService {
    /**
     * Lists competitions.
     *
     * @param paginationRequest page and page size
     * @param includeInactive when false, expired and inactive competitions are omitted
     * @param basePath path used to build page links
     * @return the page, with navigation links
     */
    PagedResponse<CompetitionDto> getAll(PaginationRequest paginationRequest, boolean includeInactive, String basePath);
}
