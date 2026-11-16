package com.bjjeire.api.bjjeirecompetition;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PagedResponses;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.UriService;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

/** Mongo implementation of {@link BjjEireCompetitionService}. */
@Service
@RequiredArgsConstructor
public class BjjEireCompetitionServiceImpl implements BjjEireCompetitionService {
    private static final Set<BjjEireCompetitionStatus> EDITABLE =
            Set.of(BjjEireCompetitionStatus.DRAFT, BjjEireCompetitionStatus.PUBLISHED);

    private final MongoTemplate mongoTemplate;
    private final AuditInfoProvider auditInfoProvider;
    private final AuditRecorder auditRecorder;
    private final ApiCache cache;
    private final UriService uriService;
    private final Clock clock;
    private final DivisionSignUps divisionSignUps;

    @Override
    public PagedResponse<BjjEireCompetitionSummaryDto> getUpcoming(
            PaginationRequest paginationRequest, String basePath) {
        // The Irish date is part of the key, so a page cached yesterday is never served after midnight (R3).
        LocalDate today = BjjEireCompetitionRules.today(clock.instant());
        String key = "BjjEireCompetitions_Upcoming_%s_Page%d_PageSize%d"
                .formatted(today, paginationRequest.page(), paginationRequest.pageSize());
        PagedResponse<BjjEireCompetitionSummaryDto> cached = cache.getOrCreate(
                ApiCache.BJJEIRE_COMPETITIONS_TAG,
                key,
                () -> loadPage(
                        paginationRequest,
                        Criteria.where("status")
                                .is(BjjEireCompetitionStatus.PUBLISHED)
                                .and("date")
                                .gte(today),
                        Sort.by(Sort.Order.asc("date"), Sort.Order.asc("name"))));
        return PagedResponses.withNavigationLinks(atNow(cached), uriService, basePath);
    }

    @Override
    public Optional<BjjEireCompetitionDto> getPublishedBySlug(String slug) {
        BjjEireCompetitionDto cached = cache.getOrCreate(
                ApiCache.BJJEIRE_COMPETITIONS_TAG, "BjjEireCompetition_Slug" + slug, () -> loadPublicBySlug(slug));
        // The cached copy can be minutes old; the registration state is worked out for this instant.
        return Optional.ofNullable(cached).map(dto -> dto.at(clock.instant()));
    }

    @Override
    public PagedResponse<BjjEireCompetitionSummaryDto> getAllForAdmin(
            PaginationRequest paginationRequest, String basePath) {
        PagedResponse<BjjEireCompetitionSummaryDto> page =
                loadPage(paginationRequest, new Criteria(), Sort.by(Sort.Order.desc("date"), Sort.Order.asc("name")));
        return PagedResponses.withNavigationLinks(page, uriService, basePath);
    }

    @Override
    public Optional<BjjEireCompetitionDto> getForAdmin(String id) {
        return Optional.ofNullable(mongoTemplate.findById(id, BjjEireCompetition.class))
                .map(competition -> BjjEireCompetitionMapper.toDto(competition, clock.instant()));
    }

    @Override
    public BjjEireCompetitionDto create(CreateBjjEireCompetitionCommand command) {
        List<Division> divisions = mergeDivisions(command.divisions(), List.of());
        BjjEireCompetition competition = BjjEireCompetition.builder()
                .slug(command.slug())
                .name(command.name().trim())
                .description(command.description())
                .date(command.date())
                .venue(command.venue())
                .entryFeeCents(command.entryFeeCents())
                .registrationOpensAt(command.registrationOpensAt())
                .registrationClosesAt(command.registrationClosesAt())
                .competitorLimit(command.competitorLimit())
                .status(BjjEireCompetitionStatus.DRAFT)
                .divisions(divisions)
                .version(0L)
                .createdOnUtc(auditInfoProvider.currentInstant())
                .createdBy(auditInfoProvider.currentUser())
                .build();

        BjjEireCompetition saved;
        try {
            saved = mongoTemplate.insert(competition);
        } catch (DuplicateKeyException duplicate) {
            throw slugTaken(duplicate);
        }
        afterWrite(AuditAction.Create, saved.getId());
        return BjjEireCompetitionMapper.toDto(saved, clock.instant());
    }

    @Override
    public Optional<BjjEireCompetitionDto> update(String id, UpdateBjjEireCompetitionCommand command) {
        BjjEireCompetition existing = mongoTemplate.findById(id, BjjEireCompetition.class);
        if (existing == null) {
            return Optional.empty();
        }
        if (!EDITABLE.contains(existing.getStatus())) {
            throw ApiProblems.conflict(
                    ProblemTypes.CONFLICT, "A finished or cancelled competition can no longer be edited.");
        }

        List<Division> current = existing.getDivisions() == null ? List.of() : existing.getDivisions();
        List<Division> divisions = mergeDivisions(command.divisions(), current);
        Set<String> kept = divisions.stream().map(Division::getId).collect(Collectors.toSet());
        List<String> removed = current.stream()
                .map(Division::getId)
                .filter(divisionId -> !kept.contains(divisionId))
                .toList();
        if (divisionSignUps.anyActive(id, removed)) {
            throw ApiProblems.conflict(
                    ProblemTypes.DIVISION_HAS_SIGNUPS,
                    "A division you removed still has sign-ups. Move or cancel those sign-ups first.");
        }

        if (existing.getStatus() == BjjEireCompetitionStatus.PUBLISHED) {
            // What the public already sees must stay publishable.
            BjjEireCompetitionRules.requirePublishable(BjjEireCompetition.builder()
                    .date(command.date())
                    .registrationOpensAt(command.registrationOpensAt())
                    .registrationClosesAt(command.registrationClosesAt())
                    .divisions(divisions)
                    .build());
        }

        // Field-by-field, so a place taken while the organiser was editing is not overwritten.
        Update update = new Update()
                .set("slug", command.slug())
                .set("name", command.name().trim())
                .set("description", command.description())
                .set("date", command.date())
                .set("venue", command.venue())
                .set("entryFeeCents", command.entryFeeCents())
                .set("registrationOpensAt", command.registrationOpensAt())
                .set("registrationClosesAt", command.registrationClosesAt())
                .set("competitorLimit", command.competitorLimit())
                .set("divisions", divisions);
        BjjEireCompetition saved;
        try {
            saved = modify(id, EDITABLE, false, command.version(), update);
        } catch (DuplicateKeyException duplicate) {
            throw slugTaken(duplicate);
        }
        if (saved == null) {
            throw changedMeanwhile();
        }
        afterWrite(AuditAction.Update, id);
        return Optional.of(BjjEireCompetitionMapper.toDto(saved, clock.instant()));
    }

    @Override
    public Optional<BjjEireCompetitionDto> publish(String id) {
        BjjEireCompetition existing = mongoTemplate.findById(id, BjjEireCompetition.class);
        if (existing == null) {
            return Optional.empty();
        }
        if (!existing.getStatus().canBecome(BjjEireCompetitionStatus.PUBLISHED)) {
            throw ApiProblems.conflict(ProblemTypes.CONFLICT, "Only a draft competition can be published.");
        }
        BjjEireCompetitionRules.requirePublishable(existing);

        // The checks above ran on a copy. The write requires a division too, so an edit that emptied the
        // competition in the meantime cannot be published.
        BjjEireCompetition saved = modify(
                id,
                Set.of(BjjEireCompetitionStatus.DRAFT),
                true,
                existing.getVersion(),
                new Update().set("status", BjjEireCompetitionStatus.PUBLISHED));
        if (saved == null) {
            throw changedMeanwhile();
        }
        afterWrite(AuditAction.Publish, id);
        return Optional.of(BjjEireCompetitionMapper.toDto(saved, clock.instant()));
    }

    @Override
    public Optional<BjjEireCompetitionDto> cancel(String id) {
        BjjEireCompetition existing = mongoTemplate.findById(id, BjjEireCompetition.class);
        if (existing == null) {
            return Optional.empty();
        }
        if (existing.getStatus() == BjjEireCompetitionStatus.CANCELLED) {
            return Optional.of(BjjEireCompetitionMapper.toDto(existing, clock.instant()));
        }
        if (!existing.getStatus().canBecome(BjjEireCompetitionStatus.CANCELLED)) {
            throw ApiProblems.conflict(ProblemTypes.CONFLICT, "A finished competition can no longer be cancelled.");
        }
        BjjEireCompetition saved = modify(
                id,
                Set.of(BjjEireCompetitionStatus.DRAFT, BjjEireCompetitionStatus.PUBLISHED),
                false,
                existing.getVersion(),
                new Update().set("status", BjjEireCompetitionStatus.CANCELLED));
        if (saved == null) {
            throw changedMeanwhile();
        }
        afterWrite(AuditAction.Update, id);
        return Optional.of(BjjEireCompetitionMapper.toDto(saved, clock.instant()));
    }

    @Override
    public Optional<BjjEireCompetitionDto> getPublicById(String id) {
        Query query = Query.query(Criteria.where("_id").is(id).and("status").in(BjjEireCompetitionStatus.PUBLIC));
        return Optional.ofNullable(mongoTemplate.findOne(query, BjjEireCompetition.class))
                .map(competition -> BjjEireCompetitionMapper.toDto(competition, clock.instant()));
    }

    @Override
    public boolean takePlace(String id) {
        BjjEireCompetition current = mongoTemplate.findById(id, BjjEireCompetition.class);
        if (current == null || current.getStatus() != BjjEireCompetitionStatus.PUBLISHED) {
            return false;
        }
        Criteria filter = Criteria.where("_id").is(id).and("status").is(BjjEireCompetitionStatus.PUBLISHED);
        Integer limit = current.getCompetitorLimit();
        if (limit == null) {
            filter.and("competitorLimit").is(null);
        } else {
            // The limit read above is part of the guard: an organiser changing it in between makes this miss, not
            // overshoot. The caller sees "full" and may retry.
            filter.and("competitorLimit").is(limit).and("placesTaken").lt(limit);
        }
        boolean taken = mongoTemplate
                        .updateFirst(Query.query(filter), new Update().inc("placesTaken", 1), BjjEireCompetition.class)
                        .getModifiedCount()
                == 1;
        if (taken) {
            cache.removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
        }
        return taken;
    }

    @Override
    public void releasePlace(String id) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(id).and("placesTaken").gt(0)),
                new Update().inc("placesTaken", -1),
                BjjEireCompetition.class);
        cache.removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
    }

    /**
     * Applies an organiser write only to the copy it was made from: same version, an expected status, and with
     * {@code requireDivision} at least one division. Counts the write in {@code version}.
     *
     * @return the updated competition, or null when the stored one no longer matches
     */
    private BjjEireCompetition modify(
            String id, Set<BjjEireCompetitionStatus> expected, boolean requireDivision, Long version, Update update) {
        update.set("updatedAt", auditInfoProvider.currentInstant())
                .set("updatedBy", auditInfoProvider.currentUser())
                .inc("version", 1);
        Criteria filter = Criteria.where("_id")
                .is(id)
                .and("status")
                .in(expected)
                .and("version")
                .is(version);
        if (requireDivision) {
            filter.and("divisions.0").exists(true);
        }
        return mongoTemplate.findAndModify(
                Query.query(filter), update, FindAndModifyOptions.options().returnNew(true), BjjEireCompetition.class);
    }

    /** Keeps the id of a division the competition already has, and gives a new division an id. */
    private static List<Division> mergeDivisions(List<DivisionDto> incoming, List<Division> current) {
        Map<String, Division> known = current.stream().collect(Collectors.toMap(Division::getId, Function.identity()));
        List<Division> merged = new ArrayList<>();
        for (DivisionDto dto : incoming == null ? List.<DivisionDto>of() : incoming) {
            if (dto.id() != null && !known.containsKey(dto.id())) {
                throw ApiProblems.validation(
                        "Divisions", "Division " + dto.id() + " is not part of this competition.", "UNKNOWN_DIVISION");
            }
            String id = dto.id() != null ? dto.id() : new ObjectId().toHexString();
            merged.add(BjjEireCompetitionMapper.toDivision(dto, id));
        }
        if (merged.stream().map(Division::getId).distinct().count() != merged.size()
                || BjjEireCompetitionRules.hasDuplicateDivisions(merged)) {
            throw ApiProblems.validation(
                    "Divisions",
                    "Each division must be a different combination of discipline, gender, age category, belt and"
                            + " weight class.",
                    "DUPLICATE_DIVISION");
        }
        return merged;
    }

    private BjjEireCompetitionDto loadPublicBySlug(String slug) {
        Query query = Query.query(Criteria.where("slug").is(slug).and("status").in(BjjEireCompetitionStatus.PUBLIC));
        BjjEireCompetition competition = mongoTemplate.findOne(query, BjjEireCompetition.class);
        return competition == null ? null : BjjEireCompetitionMapper.toDto(competition, clock.instant());
    }

    private PagedResponse<BjjEireCompetitionSummaryDto> loadPage(
            PaginationRequest paginationRequest, Criteria criteria, Sort sort) {
        Query query = Query.query(criteria);
        long totalItems = mongoTemplate.count(query, BjjEireCompetition.class);
        query.with(PageRequest.of(paginationRequest.page() - 1, paginationRequest.pageSize(), sort));
        Instant now = clock.instant();
        List<BjjEireCompetitionSummaryDto> competitions = mongoTemplate.find(query, BjjEireCompetition.class).stream()
                .map(competition -> BjjEireCompetitionMapper.toSummary(competition, now))
                .toList();
        return PagedResponses.of(competitions, paginationRequest, totalItems);
    }

    private PagedResponse<BjjEireCompetitionSummaryDto> atNow(PagedResponse<BjjEireCompetitionSummaryDto> cached) {
        Instant now = clock.instant();
        return new PagedResponse<>(
                cached.data().stream().map(summary -> summary.at(now)).toList(), cached.pagination());
    }

    private void afterWrite(AuditAction action, String id) {
        auditRecorder.record(action, BjjEireCompetition.ENTITY_NAME, id, 1);
        cache.removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
    }

    private static OptimisticLockingFailureException changedMeanwhile() {
        // ApiExceptionHandler answers 409 urn:bjjeire:conflict, telling the caller to reload and retry.
        return new OptimisticLockingFailureException(
                "The competition was changed by another save. Reload it and retry.");
    }

    private static RuntimeException slugTaken(DuplicateKeyException duplicate) {
        RuntimeException conflict =
                ApiProblems.conflict(ProblemTypes.CONFLICT, "Another competition already uses this slug.");
        conflict.addSuppressed(duplicate);
        return conflict;
    }
}
