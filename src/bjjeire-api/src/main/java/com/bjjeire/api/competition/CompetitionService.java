package com.bjjeire.api.competition;

import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PagedResponses;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.UriService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Service
@RequiredArgsConstructor
public class CompetitionService {
    private final MongoTemplate mongoTemplate;
    private final Clock clock;
    private final ApiCache cache;
    private final UriService uriService;

    public PagedResponse<CompetitionDto> getAll(
            PaginationRequest paginationRequest, boolean includeInactive, String basePath) {
        String cacheKey = "Competitions_All_Page%d_PageSize%d_IncludeInactive%s"
                .formatted(paginationRequest.page(), paginationRequest.pageSize(), includeInactive);
        PagedResponse<CompetitionDto> cached = cache.getOrCreate(
                ApiCache.COMPETITIONS_TAG, cacheKey, () -> loadPage(paginationRequest, includeInactive));

        MultiValueMap<String, String> filters = new LinkedMultiValueMap<>();
        if (includeInactive) {
            filters.add("includeInactive", "true");
        }
        return PagedResponses.withNavigationLinks(cached, uriService, basePath, filters);
    }

    private PagedResponse<CompetitionDto> loadPage(PaginationRequest paginationRequest, boolean includeInactive) {
        Query query = new Query();
        if (!includeInactive) {
            Instant now = clock.instant();
            query.addCriteria(new Criteria()
                    .andOperator(
                            Criteria.where("isActive").is(true),
                            new Criteria()
                                    .orOperator(
                                            Criteria.where("endDate").is(null),
                                            Criteria.where("endDate").gte(now))));
        }

        long totalItems = mongoTemplate.count(query, Competition.class);
        int pageIndex = paginationRequest.page() - 1;
        query.with(PageRequest.of(
                pageIndex, paginationRequest.pageSize(), Sort.by(Sort.Order.asc("startDate"), Sort.Order.asc("name"))));

        List<CompetitionDto> competitions = mongoTemplate.find(query, Competition.class).stream()
                .map(CompetitionMapper::toDto)
                .toList();

        return PagedResponses.of(competitions, paginationRequest, totalItems);
    }
}
