package com.bjjeire.api.event;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.common.County;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PagedResponses;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.UriService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BjjEventService {
    private final MongoTemplate mongoTemplate;
    private final Clock clock;
    private final AuditInfoProvider auditInfoProvider;
    private final AuditRecorder auditRecorder;
    private final ApiCache cache;
    private final UriService uriService;

    public PagedResponse<BjjEventDto> getAll(
            PaginationRequest paginationRequest,
            County county,
            List<BjjEventType> types,
            boolean includeInactive,
            String basePath) {
        String cacheKey = listCacheKey(paginationRequest, county, types, includeInactive);
        PagedResponse<BjjEventDto> cached = cache.getOrCreate(
                ApiCache.BJJ_EVENTS_TAG, cacheKey, () -> loadPage(paginationRequest, county, types, includeInactive));

        return PagedResponses.withNavigationLinks(cached, uriService, basePath);
    }

    public Optional<BjjEventDto> getById(String id) {
        BjjEventDto dto = cache.getOrCreate(ApiCache.BJJ_EVENTS_TAG, byIdCacheKey(id), () -> {
            BjjEvent event = mongoTemplate.findById(id, BjjEvent.class);
            return event != null ? BjjEventMapper.toDto(event) : null;
        });
        return Optional.ofNullable(dto);
    }

    public CreateBjjEventResponse create(CreateBjjEventCommand command) {
        BjjEvent event = BjjEventMapper.toEntity(command.data());
        event.setCreatedOnUtc(auditInfoProvider.currentInstant());
        event.setCreatedBy(auditInfoProvider.currentUser());
        event.stampExpiry();

        BjjEvent saved = mongoTemplate.save(event);
        BjjEventDto dto = BjjEventMapper.toDto(saved);
        invalidateAndPrime(dto);
        return new CreateBjjEventResponse(dto);
    }

    public Optional<UpdateBjjEventResponse> update(String id, UpdateBjjEventCommand command) {
        return Optional.ofNullable(mongoTemplate.findById(id, BjjEvent.class)).map(existing -> {
            BjjEventMapper.apply(command.data(), existing);
            existing.setId(id);
            existing.setUpdatedOnUtc(auditInfoProvider.currentInstant());
            existing.setUpdatedBy(auditInfoProvider.currentUser());
            existing.stampExpiry();

            BjjEvent saved = mongoTemplate.save(existing);
            BjjEventDto dto = BjjEventMapper.toDto(saved);
            invalidateAndPrime(dto);
            return new UpdateBjjEventResponse(dto);
        });
    }

    public boolean delete(String id) {
        BjjEvent event = mongoTemplate.findById(id, BjjEvent.class);
        if (event == null) {
            return false;
        }

        mongoTemplate.remove(event);
        auditRecorder.record(AuditAction.Delete, "BjjEvent", id, 1);
        // Hard invalidate only — no write-through after delete.
        cache.remove(ApiCache.BJJ_EVENTS_TAG, byIdCacheKey(id));
        cache.removeByTag(ApiCache.BJJ_EVENTS_TAG);
        return true;
    }

    // Write-through: evict tag-scoped entries (list pages + by-id) so any stale
    // value is gone, then immediately prime the by-id key with the fresh entity.
    // Order matters — put must come after removeByTag, otherwise the tag-remove
    // would clobber the freshly-set value.
    private void invalidateAndPrime(BjjEventDto fresh) {
        cache.removeByTag(ApiCache.BJJ_EVENTS_TAG);
        cache.put(ApiCache.BJJ_EVENTS_TAG, byIdCacheKey(fresh.id()), fresh);
    }

    private PagedResponse<BjjEventDto> loadPage(
            PaginationRequest paginationRequest, County county, List<BjjEventType> types, boolean includeInactive) {
        Query query = new Query();
        query.addCriteria(Criteria.where("status").ne(EventStatus.Completed));

        if (!includeInactive) {
            Instant now = clock.instant();
            query.addCriteria(new Criteria()
                    .andOperator(
                            Criteria.where("isActive").is(true),
                            new Criteria()
                                    .orOperator(
                                            Criteria.where("schedule.endDate").is(null),
                                            Criteria.where("schedule.endDate").gte(now))));
        }

        if (county != null) {
            query.addCriteria(Criteria.where("county").is(county));
        }

        if (types != null && !types.isEmpty()) {
            query.addCriteria(Criteria.where("types").in(types));
        }

        long totalItems = mongoTemplate.count(query, BjjEvent.class);
        int pageIndex = paginationRequest.page() - 1;
        query.with(PageRequest.of(pageIndex, paginationRequest.pageSize(), Sort.by(Sort.Order.asc("createdAt"))));

        List<BjjEventDto> events = mongoTemplate.find(query, BjjEvent.class).stream()
                .map(BjjEventMapper::toDto)
                .toList();

        return PagedResponses.of(events, paginationRequest, totalItems);
    }

    private static String listCacheKey(
            PaginationRequest paginationRequest, County county, List<BjjEventType> types, boolean includeInactive) {
        String countyPart = (county != null ? county.toString() : "None").toLowerCase(Locale.ROOT);
        String typesPart = types != null && !types.isEmpty()
                ? types.stream()
                        .sorted()
                        .map(Enum::toString)
                        .collect(Collectors.joining("-"))
                        .toLowerCase(Locale.ROOT)
                : "none";
        return "BjjEvents_All_Page%d_PageSize%d_County%s_Types%s_IncludeInactive%s"
                .formatted(
                        paginationRequest.page(), paginationRequest.pageSize(), countyPart, typesPart, includeInactive);
    }

    private static String byIdCacheKey(String id) {
        return "BjjEvents_Id" + id;
    }
}
