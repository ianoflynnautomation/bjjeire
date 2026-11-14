package com.bjjeire.api.tournament;

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

/** Mongo implementation of {@link TournamentService}. */
@Service
@RequiredArgsConstructor
public class TournamentServiceImpl implements TournamentService {
    private static final Set<TournamentStatus> EDITABLE = Set.of(TournamentStatus.DRAFT, TournamentStatus.PUBLISHED);

    private final MongoTemplate mongoTemplate;
    private final AuditInfoProvider auditInfoProvider;
    private final AuditRecorder auditRecorder;
    private final ApiCache cache;
    private final UriService uriService;
    private final Clock clock;
    private final DivisionSignUps divisionSignUps;

    @Override
    public PagedResponse<TournamentSummaryDto> getPublished(PaginationRequest paginationRequest, String basePath) {
        String key = "Tournaments_Public_Page%d_PageSize%d"
                .formatted(paginationRequest.page(), paginationRequest.pageSize());
        PagedResponse<TournamentSummaryDto> cached = cache.getOrCreate(
                ApiCache.TOURNAMENTS_TAG,
                key,
                () -> loadPage(
                        paginationRequest,
                        Criteria.where("status").in(TournamentStatus.PUBLIC),
                        Sort.by(Sort.Order.asc("date"), Sort.Order.asc("name"))));
        return PagedResponses.withNavigationLinks(atNow(cached), uriService, basePath);
    }

    @Override
    public Optional<TournamentDto> getPublishedBySlug(String slug) {
        TournamentDto cached =
                cache.getOrCreate(ApiCache.TOURNAMENTS_TAG, "Tournament_Slug" + slug, () -> loadPublicBySlug(slug));
        // The cached copy can be minutes old; the registration state is worked out for this instant.
        return Optional.ofNullable(cached).map(dto -> dto.at(clock.instant()));
    }

    @Override
    public PagedResponse<TournamentSummaryDto> getAllForAdmin(PaginationRequest paginationRequest, String basePath) {
        PagedResponse<TournamentSummaryDto> page =
                loadPage(paginationRequest, new Criteria(), Sort.by(Sort.Order.desc("date"), Sort.Order.asc("name")));
        return PagedResponses.withNavigationLinks(page, uriService, basePath);
    }

    @Override
    public Optional<TournamentDto> getForAdmin(String id) {
        return Optional.ofNullable(mongoTemplate.findById(id, Tournament.class))
                .map(tournament -> TournamentMapper.toDto(tournament, clock.instant()));
    }

    @Override
    public TournamentDto create(CreateTournamentCommand command) {
        List<Division> divisions = mergeDivisions(command.divisions(), List.of());
        Tournament tournament = Tournament.builder()
                .slug(command.slug())
                .name(command.name().trim())
                .description(command.description())
                .date(command.date())
                .venue(command.venue())
                .entryFeeCents(command.entryFeeCents())
                .registrationOpensAt(command.registrationOpensAt())
                .registrationClosesAt(command.registrationClosesAt())
                .competitorLimit(command.competitorLimit())
                .status(TournamentStatus.DRAFT)
                .divisions(divisions)
                .version(0L)
                .createdOnUtc(auditInfoProvider.currentInstant())
                .createdBy(auditInfoProvider.currentUser())
                .build();

        Tournament saved;
        try {
            saved = mongoTemplate.insert(tournament);
        } catch (DuplicateKeyException duplicate) {
            throw slugTaken(duplicate);
        }
        afterWrite(AuditAction.Create, saved.getId());
        return TournamentMapper.toDto(saved, clock.instant());
    }

    @Override
    public Optional<TournamentDto> update(String id, UpdateTournamentCommand command) {
        Tournament existing = mongoTemplate.findById(id, Tournament.class);
        if (existing == null) {
            return Optional.empty();
        }
        if (!EDITABLE.contains(existing.getStatus())) {
            throw ApiProblems.conflict(
                    ProblemTypes.CONFLICT, "A finished or cancelled tournament can no longer be edited.");
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

        if (existing.getStatus() == TournamentStatus.PUBLISHED) {
            // What the public already sees must stay publishable.
            TournamentRules.requirePublishable(Tournament.builder()
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
        Tournament saved;
        try {
            saved = modify(id, EDITABLE, false, command.version(), update);
        } catch (DuplicateKeyException duplicate) {
            throw slugTaken(duplicate);
        }
        if (saved == null) {
            throw changedMeanwhile();
        }
        afterWrite(AuditAction.Update, id);
        return Optional.of(TournamentMapper.toDto(saved, clock.instant()));
    }

    @Override
    public Optional<TournamentDto> publish(String id) {
        Tournament existing = mongoTemplate.findById(id, Tournament.class);
        if (existing == null) {
            return Optional.empty();
        }
        if (!existing.getStatus().canBecome(TournamentStatus.PUBLISHED)) {
            throw ApiProblems.conflict(ProblemTypes.CONFLICT, "Only a draft tournament can be published.");
        }
        TournamentRules.requirePublishable(existing);

        // The checks above ran on a copy. The write requires a division too, so an edit that emptied the
        // tournament in the meantime cannot be published.
        Tournament saved = modify(
                id,
                Set.of(TournamentStatus.DRAFT),
                true,
                existing.getVersion(),
                new Update().set("status", TournamentStatus.PUBLISHED));
        if (saved == null) {
            throw changedMeanwhile();
        }
        afterWrite(AuditAction.Publish, id);
        return Optional.of(TournamentMapper.toDto(saved, clock.instant()));
    }

    /** Applies an update only while the tournament is still in one of the expected statuses. */
    /**
     * Applies an organiser write only to the copy it was made from: same version, an expected status, and with
     * {@code requireDivision} at least one division. Counts the write in {@code version}.
     *
     * @return the updated tournament, or null when the stored one no longer matches
     */
    private Tournament modify(
            String id, Set<TournamentStatus> expected, boolean requireDivision, Long version, Update update) {
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
                Query.query(filter), update, FindAndModifyOptions.options().returnNew(true), Tournament.class);
    }

    /** Keeps the id of a division the tournament already has, and gives a new division an id. */
    private static List<Division> mergeDivisions(List<DivisionDto> incoming, List<Division> current) {
        Map<String, Division> known = current.stream().collect(Collectors.toMap(Division::getId, Function.identity()));
        List<Division> merged = new ArrayList<>();
        for (DivisionDto dto : incoming == null ? List.<DivisionDto>of() : incoming) {
            if (dto.id() != null && !known.containsKey(dto.id())) {
                throw ApiProblems.validation(
                        "Divisions", "Division " + dto.id() + " is not part of this tournament.", "UNKNOWN_DIVISION");
            }
            String id = dto.id() != null ? dto.id() : new ObjectId().toHexString();
            merged.add(TournamentMapper.toDivision(dto, id));
        }
        if (merged.stream().map(Division::getId).distinct().count() != merged.size()
                || TournamentRules.hasDuplicateDivisions(merged)) {
            throw ApiProblems.validation(
                    "Divisions",
                    "Each division must be a different combination of discipline, gender, age category, belt and"
                            + " weight class.",
                    "DUPLICATE_DIVISION");
        }
        return merged;
    }

    private TournamentDto loadPublicBySlug(String slug) {
        Query query = Query.query(Criteria.where("slug").is(slug).and("status").in(TournamentStatus.PUBLIC));
        Tournament tournament = mongoTemplate.findOne(query, Tournament.class);
        return tournament == null ? null : TournamentMapper.toDto(tournament, clock.instant());
    }

    private PagedResponse<TournamentSummaryDto> loadPage(
            PaginationRequest paginationRequest, Criteria criteria, Sort sort) {
        Query query = Query.query(criteria);
        long totalItems = mongoTemplate.count(query, Tournament.class);
        query.with(PageRequest.of(paginationRequest.page() - 1, paginationRequest.pageSize(), sort));
        Instant now = clock.instant();
        List<TournamentSummaryDto> tournaments = mongoTemplate.find(query, Tournament.class).stream()
                .map(tournament -> TournamentMapper.toSummary(tournament, now))
                .toList();
        return PagedResponses.of(tournaments, paginationRequest, totalItems);
    }

    private PagedResponse<TournamentSummaryDto> atNow(PagedResponse<TournamentSummaryDto> cached) {
        Instant now = clock.instant();
        return new PagedResponse<>(
                cached.data().stream().map(summary -> summary.at(now)).toList(), cached.pagination());
    }

    private void afterWrite(AuditAction action, String id) {
        auditRecorder.record(action, Tournament.ENTITY_NAME, id, 1);
        cache.removeByTag(ApiCache.TOURNAMENTS_TAG);
    }

    private static OptimisticLockingFailureException changedMeanwhile() {
        // ApiExceptionHandler answers 409 urn:bjjeire:conflict, telling the caller to reload and retry.
        return new OptimisticLockingFailureException(
                "The tournament was changed by another save. Reload it and retry.");
    }

    private static RuntimeException slugTaken(DuplicateKeyException duplicate) {
        RuntimeException conflict =
                ApiProblems.conflict(ProblemTypes.CONFLICT, "Another tournament already uses this slug.");
        conflict.addSuppressed(duplicate);
        return conflict;
    }
}
