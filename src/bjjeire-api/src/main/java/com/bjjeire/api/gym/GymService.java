package com.bjjeire.api.gym;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.common.County;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PagedResponses;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.UriService;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
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
public class GymService {
    private final GymRepository gymRepository;
    private final MongoTemplate mongoTemplate;
    private final AuditInfoProvider auditInfoProvider;
    private final AuditRecorder auditRecorder;
    private final ApiCache cache;
    private final UriService uriService;

    public PagedResponse<GymDto> getAll(PaginationRequest paginationRequest, County county, String basePath) {
        String cacheKey = listCacheKey(paginationRequest, county);
        PagedResponse<GymDto> cached =
                cache.getOrCreate(ApiCache.GYMS_TAG, cacheKey, () -> loadPage(paginationRequest, county));

        return PagedResponses.withNavigationLinks(cached, uriService, basePath, listFilters(county));
    }

    private static MultiValueMap<String, String> listFilters(County county) {
        MultiValueMap<String, String> filters = new LinkedMultiValueMap<>();
        if (county != null) {
            filters.add("county", county.name());
        }
        return filters;
    }

    public Optional<GymDto> getById(String id) {
        GymDto dto = cache.getOrCreate(
                ApiCache.GYMS_TAG,
                byIdCacheKey(id),
                () -> gymRepository
                        .findById(id)
                        .filter(gym -> gym.getStatus() == GymStatus.Active)
                        .map(GymMapper::toDto)
                        .orElse(null));
        return Optional.ofNullable(dto);
    }

    public CreateGymResponse create(CreateGymCommand command) {
        Gym gym = GymMapper.toEntity(command.data());
        gym.setCreatedOnUtc(auditInfoProvider.currentInstant());
        gym.setCreatedBy(auditInfoProvider.currentUser());

        Gym saved = gymRepository.save(gym);
        GymDto dto = GymMapper.toDto(saved);
        invalidateAndPrime(dto);
        return new CreateGymResponse(dto);
    }

    public Optional<UpdateGymResponse> update(String id, UpdateGymCommand command) {
        return gymRepository.findById(id).map(existing -> {
            GymMapper.apply(command.data(), existing);
            existing.setId(id);
            existing.setUpdatedOnUtc(auditInfoProvider.currentInstant());
            existing.setUpdatedBy(auditInfoProvider.currentUser());

            Gym saved = gymRepository.save(existing);
            GymDto dto = GymMapper.toDto(saved);
            invalidateAndPrime(dto);
            return new UpdateGymResponse(dto);
        });
    }

    public boolean delete(String id) {
        return gymRepository
                .findById(id)
                .map(gym -> {
                    gymRepository.delete(gym);
                    auditRecorder.record(AuditAction.Delete, "Gym", id, 1);
                    // Hard invalidate only — no write-through after delete.
                    cache.remove(ApiCache.GYMS_TAG, byIdCacheKey(id));
                    cache.removeByTag(ApiCache.GYMS_TAG);
                    return true;
                })
                .orElse(false);
    }

    // Write-through: evict tag-scoped entries, then prime the by-id key with
    // the fresh entity; put must come after removeByTag.
    private void invalidateAndPrime(GymDto fresh) {
        cache.removeByTag(ApiCache.GYMS_TAG);
        cache.put(ApiCache.GYMS_TAG, byIdCacheKey(fresh.id()), fresh);
    }

    private PagedResponse<GymDto> loadPage(PaginationRequest paginationRequest, County county) {
        Query query = new Query().addCriteria(Criteria.where("status").is(GymStatus.Active));
        if (county != null) {
            query.addCriteria(Criteria.where("county").is(county));
        }

        long totalItems = mongoTemplate.count(query, Gym.class);
        int pageIndex = paginationRequest.page() - 1;
        query.with(PageRequest.of(
                pageIndex, paginationRequest.pageSize(), Sort.by("name").ascending()));

        List<GymDto> gyms = mongoTemplate.find(query, Gym.class).stream()
                .map(GymMapper::toDto)
                .toList();

        return PagedResponses.of(gyms, paginationRequest, totalItems);
    }

    private static String listCacheKey(PaginationRequest paginationRequest, County county) {
        String countyPart = (county != null ? county.toString() : "None").toLowerCase(Locale.ROOT);
        return "Gyms_All_Page%d_PageSize%d_County%s"
                .formatted(paginationRequest.page(), paginationRequest.pageSize(), countyPart);
    }

    private static String byIdCacheKey(String id) {
        return "Gym_Id" + id;
    }
}
