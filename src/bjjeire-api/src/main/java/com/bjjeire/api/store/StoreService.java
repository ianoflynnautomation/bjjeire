package com.bjjeire.api.store;

import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PagedResponses;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.UriService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StoreService {
    private final MongoTemplate mongoTemplate;
    private final ApiCache cache;
    private final UriService uriService;

    public PagedResponse<StoreDto> getAll(PaginationRequest paginationRequest, String basePath) {
        String cacheKey =
                "Stores_All_Page%d_PageSize%d".formatted(paginationRequest.page(), paginationRequest.pageSize());
        PagedResponse<StoreDto> cached =
                cache.getOrCreate(ApiCache.STORES_TAG, cacheKey, () -> loadPage(paginationRequest));

        return PagedResponses.withNavigationLinks(cached, uriService, basePath);
    }

    private PagedResponse<StoreDto> loadPage(PaginationRequest paginationRequest) {
        Query query = new Query().addCriteria(Criteria.where("isActive").is(true));
        long totalItems = mongoTemplate.count(query, Store.class);
        int pageIndex = paginationRequest.page() - 1;
        query.with(PageRequest.of(
                pageIndex, paginationRequest.pageSize(), Sort.by("name").ascending()));

        List<StoreDto> stores = mongoTemplate.find(query, Store.class).stream()
                .map(StoreMapper::toDto)
                .toList();

        return PagedResponses.of(stores, paginationRequest, totalItems);
    }
}
