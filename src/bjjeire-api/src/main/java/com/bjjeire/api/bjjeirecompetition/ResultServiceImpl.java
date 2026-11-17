package com.bjjeire.api.bjjeirecompetition;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

/**
 * Mongo implementation of {@link ResultService}. A result is embedded in its division; a write replaces the division
 * list guarded by the competition's version, as an organiser edit does, so neither overwrites the other.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResultServiceImpl implements ResultService {
    /** Results may be recorded and corrected once published, and still after finishing (data-model.md). */
    private static final Set<BjjEireCompetitionStatus> RECORDABLE =
            Set.of(BjjEireCompetitionStatus.PUBLISHED, BjjEireCompetitionStatus.FINISHED);

    /** A cancelled competition has no leaderboard: every sign-up in it was cancelled. */
    private static final Set<BjjEireCompetitionStatus> WITH_LEADERBOARD = RECORDABLE;

    /** How often an undo is tried against a freshly read competition before it is left for the organiser. */
    private static final int UNDO_ATTEMPTS = 3;

    private final MongoTemplate mongoTemplate;
    private final AuditInfoProvider auditInfoProvider;
    private final AuditRecorder auditRecorder;
    private final ApiCache cache;
    private final DivisionSignUps divisionSignUps;

    @Override
    public Optional<LeaderboardDto> getLeaderboard(String competitionId) {
        return Optional.ofNullable(cache.getOrCreate(
                ApiCache.BJJEIRE_COMPETITIONS_TAG,
                "BjjEireCompetition_Leaderboard_" + competitionId,
                () -> loadLeaderboard(competitionId)));
    }

    @Override
    public Optional<List<AdminDivisionResultDto>> getForAdmin(String competitionId) {
        BjjEireCompetition competition = mongoTemplate.findById(competitionId, BjjEireCompetition.class);
        if (competition == null) {
            return Optional.empty();
        }
        Map<String, List<ResultCompetitorDto>> byDivision = new HashMap<>();
        for (ResultEntrant entrant : divisionSignUps.confirmed(competitionId)) {
            byDivision
                    .computeIfAbsent(entrant.divisionId(), ignored -> new ArrayList<>())
                    .add(toCompetitor(entrant));
        }
        return Optional.of(divisions(competition).stream()
                .map(division -> new AdminDivisionResultDto(
                        division.getId(),
                        toDto(division.getResult()),
                        List.copyOf(byDivision.getOrDefault(division.getId(), List.of()))))
                .toList());
    }

    @Override
    public Optional<AdminDivisionResultDto> record(
            String competitionId, String divisionId, RecordResultCommand command) {
        BjjEireCompetition competition = mongoTemplate.findById(competitionId, BjjEireCompetition.class);
        if (competition == null || findDivision(competition, divisionId) == null) {
            return Optional.empty();
        }
        requireRecordable(competition);

        List<String> named = new ArrayList<>();
        named.add(command.goldRegistrationId());
        if (command.silverRegistrationId() != null) {
            named.add(command.silverRegistrationId());
        }
        named.addAll(command.bronzes());
        if (new HashSet<>(named).size() != named.size()) {
            throw ApiProblems.conflict(
                    ProblemTypes.DUPLICATE_MEDALLIST, "A competitor can take only one place on a podium.");
        }
        Set<String> confirmedHere = confirmedIn(competitionId, divisionId);
        if (!confirmedHere.containsAll(named)) {
            throw notInDivision();
        }

        DivisionResult result = DivisionResult.builder()
                .goldRegistrationId(command.goldRegistrationId())
                .silverRegistrationId(command.silverRegistrationId())
                .bronzeRegistrationIds(new ArrayList<>(command.bronzes()))
                .confirmedCompetitors(confirmedHere.size())
                // Mongo keeps milliseconds; storing exactly that lets the undo recognise this write when read back.
                .recordedAt(auditInfoProvider.currentInstant().truncatedTo(ChronoUnit.MILLIS))
                .recordedBy(auditInfoProvider.currentUser())
                .build();
        DivisionResult previous = findDivision(competition, divisionId).getResult();
        BjjEireCompetition saved = writeResult(competition, divisionId, result);
        // A medallist cancelled or moved between the check above and this write: put the earlier result back. The
        // cancellation and move check again after their own write, so whichever lands second sees the other (FR-026).
        if (!confirmedIn(competitionId, divisionId).containsAll(named)) {
            undoResult(saved, divisionId, result, previous);
            throw notInDivision();
        }
        auditRecorder.record(AuditAction.Update, BjjEireCompetition.ENTITY_NAME, competitionId, 1);
        cache.removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);

        Division division = findDivision(saved, divisionId);
        List<ResultCompetitorDto> competitors = divisionSignUps.confirmed(competitionId).stream()
                .filter(entrant -> divisionId.equals(entrant.divisionId()))
                .map(ResultServiceImpl::toCompetitor)
                .toList();
        return Optional.of(new AdminDivisionResultDto(divisionId, toDto(division.getResult()), competitors));
    }

    @Override
    public boolean clear(String competitionId, String divisionId) {
        BjjEireCompetition competition = mongoTemplate.findById(competitionId, BjjEireCompetition.class);
        if (competition == null || findDivision(competition, divisionId) == null) {
            return false;
        }
        requireRecordable(competition);
        if (findDivision(competition, divisionId).getResult() == null) {
            return true;
        }
        writeResult(competition, divisionId, null);
        auditRecorder.record(AuditAction.Update, BjjEireCompetition.ENTITY_NAME, competitionId, 1);
        cache.removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
        return true;
    }

    @Override
    public boolean isNamedInResult(String competitionId, String registrationId) {
        BjjEireCompetition competition = mongoTemplate.findById(competitionId, BjjEireCompetition.class);
        return competition != null
                && divisions(competition).stream()
                        .map(Division::getResult)
                        .filter(result -> result != null)
                        .anyMatch(result -> result.medallistIds().contains(registrationId));
    }

    @Override
    public List<CompetitionMedals> medalsFor(Collection<SignUpRef> registrations) {
        Map<String, Set<String>> byCompetition = new LinkedHashMap<>();
        for (SignUpRef registration : registrations) {
            byCompetition
                    .computeIfAbsent(registration.competitionId(), ignored -> new HashSet<>())
                    .add(registration.registrationId());
        }
        if (byCompetition.isEmpty()) {
            return List.of();
        }
        Query query = Query.query(
                Criteria.where("_id").in(byCompetition.keySet()).and("status").in(BjjEireCompetitionStatus.PUBLIC));
        List<CompetitionMedals> medals = new ArrayList<>();
        for (BjjEireCompetition competition : mongoTemplate.find(query, BjjEireCompetition.class)) {
            Set<String> mine = byCompetition.get(competition.getId());
            int gold = 0;
            int silver = 0;
            int bronze = 0;
            for (Division division : divisions(competition)) {
                DivisionResult result = division.getResult();
                if (result == null) {
                    continue;
                }
                if (mine.contains(result.getGoldRegistrationId())) {
                    gold++;
                }
                if (result.getSilverRegistrationId() != null && mine.contains(result.getSilverRegistrationId())) {
                    silver++;
                }
                if (result.getBronzeRegistrationIds() != null) {
                    bronze += (int) result.getBronzeRegistrationIds().stream()
                            .filter(mine::contains)
                            .count();
                }
            }
            medals.add(new CompetitionMedals(
                    competition.getId(),
                    competition.getSlug(),
                    competition.getName(),
                    competition.getDate(),
                    gold,
                    silver,
                    bronze));
        }
        medals.sort(Comparator.comparing(
                        CompetitionMedals::date, Comparator.nullsLast(Comparator.<java.time.LocalDate>naturalOrder()))
                .reversed()
                .thenComparing(CompetitionMedals::name, Comparator.nullsLast(Comparator.<String>naturalOrder())));
        return List.copyOf(medals);
    }

    private LeaderboardDto loadLeaderboard(String competitionId) {
        Query query = Query.query(
                Criteria.where("_id").is(competitionId).and("status").in(WITH_LEADERBOARD));
        BjjEireCompetition competition = mongoTemplate.findOne(query, BjjEireCompetition.class);
        if (competition == null) {
            return null;
        }
        List<Division> divisions = divisions(competition);
        Set<String> medallistIds = divisions.stream()
                .map(Division::getResult)
                .filter(result -> result != null)
                .flatMap(result -> result.medallistIds().stream())
                .collect(Collectors.toSet());
        Map<String, ResultEntrant> entrants = divisionSignUps.byIds(competitionId, medallistIds).stream()
                .collect(Collectors.toMap(ResultEntrant::registrationId, Function.identity(), (a, b) -> a));
        return Leaderboards.calculate(competition.getStatus(), divisions, entrants);
    }

    private BjjEireCompetition writeResult(BjjEireCompetition competition, String divisionId, DivisionResult result) {
        List<Division> divisions = new ArrayList<>(divisions(competition));
        for (Division division : divisions) {
            if (division.getId().equals(divisionId)) {
                division.setResult(result);
            }
        }
        Update update = new Update()
                .set("divisions", divisions)
                .set("updatedAt", auditInfoProvider.currentInstant())
                .set("updatedBy", auditInfoProvider.currentUser())
                .inc("version", 1);
        Criteria filter = Criteria.where("_id")
                .is(competition.getId())
                .and("status")
                .in(RECORDABLE)
                .and("version")
                .is(competition.getVersion());
        BjjEireCompetition saved = mongoTemplate.findAndModify(
                Query.query(filter), update, FindAndModifyOptions.options().returnNew(true), BjjEireCompetition.class);
        if (saved == null) {
            // ApiExceptionHandler answers 409 urn:bjjeire:conflict.
            throw new OptimisticLockingFailureException(
                    "The competition was changed by another save. Reload it and retry.");
        }
        return saved;
    }

    /**
     * Puts the earlier result back after a write named a sign-up that was cancelled or moved meanwhile. Another
     * organiser save on the competition can land first and make the version guard miss: then the competition is read
     * again and the undo retried, as long as the stored result is still the one just written. A result the organiser
     * has since replaced or cleared is left as it is. The cache is cleared whatever happens.
     */
    private void undoResult(
            BjjEireCompetition saved, String divisionId, DivisionResult written, DivisionResult previous) {
        BjjEireCompetition current = saved;
        try {
            for (int attempt = 1; attempt <= UNDO_ATTEMPTS; attempt++) {
                try {
                    writeResult(current, divisionId, previous);
                    return;
                } catch (OptimisticLockingFailureException changedMeanwhile) {
                    current = mongoTemplate.findById(saved.getId(), BjjEireCompetition.class);
                    Division division = current == null ? null : findDivision(current, divisionId);
                    if (division == null
                            || !RECORDABLE.contains(current.getStatus())
                            || !isSameResult(division.getResult(), written)) {
                        return;
                    }
                }
            }
            log.error(
                    "ALERT result of division {} in competition {} names a sign-up that is no longer confirmed there,"
                            + " and putting the earlier result back was refused {} times: correct it by hand",
                    divisionId,
                    saved.getId(),
                    UNDO_ATTEMPTS);
        } finally {
            cache.removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
        }
    }

    /** Whether a stored result is the very write being undone: same medallists, recorded at the same instant. */
    private static boolean isSameResult(DivisionResult stored, DivisionResult written) {
        return stored != null
                && Objects.equals(toMillis(stored.getRecordedAt()), toMillis(written.getRecordedAt()))
                && Objects.equals(stored.medallistIds(), written.medallistIds());
    }

    private static Instant toMillis(Instant instant) {
        return instant == null ? null : instant.truncatedTo(ChronoUnit.MILLIS);
    }

    private Set<String> confirmedIn(String competitionId, String divisionId) {
        return divisionSignUps.confirmed(competitionId).stream()
                .filter(entrant -> divisionId.equals(entrant.divisionId()))
                .map(ResultEntrant::registrationId)
                .collect(Collectors.toSet());
    }

    private static RuntimeException notInDivision() {
        return ApiProblems.conflict(
                ProblemTypes.NOT_IN_DIVISION, "Every medallist must be a confirmed competitor in this division.");
    }

    private static void requireRecordable(BjjEireCompetition competition) {
        if (!RECORDABLE.contains(competition.getStatus())) {
            throw ApiProblems.conflict(
                    ProblemTypes.CONFLICT, "Results can be recorded only for a published or finished competition.");
        }
    }

    private static Division findDivision(BjjEireCompetition competition, String divisionId) {
        return divisions(competition).stream()
                .filter(division -> divisionId.equals(division.getId()))
                .findFirst()
                .orElse(null);
    }

    private static List<Division> divisions(BjjEireCompetition competition) {
        return competition.getDivisions() == null ? List.of() : competition.getDivisions();
    }

    private static DivisionResultDto toDto(DivisionResult result) {
        return result == null
                ? null
                : new DivisionResultDto(
                        result.getGoldRegistrationId(),
                        result.getSilverRegistrationId(),
                        result.getBronzeRegistrationIds() == null
                                ? List.of()
                                : List.copyOf(result.getBronzeRegistrationIds()),
                        result.getRecordedAt());
    }

    private static ResultCompetitorDto toCompetitor(ResultEntrant entrant) {
        return new ResultCompetitorDto(
                entrant.registrationId(), entrant.displayName(), entrant.academy(), entrant.affiliation());
    }
}
