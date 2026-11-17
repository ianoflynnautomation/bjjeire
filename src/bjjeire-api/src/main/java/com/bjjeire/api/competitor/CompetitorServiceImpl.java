package com.bjjeire.api.competitor;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionDto;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionService;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus;
import com.bjjeire.api.bjjeirecompetition.CompetitionMedals;
import com.bjjeire.api.bjjeirecompetition.DivisionDto;
import com.bjjeire.api.bjjeirecompetition.RegistrationState;
import com.bjjeire.api.bjjeirecompetition.ResultService;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.gym.GymStatus;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Mongo implementation of {@link CompetitorService}. */
@Slf4j
@Service
public class CompetitorServiceImpl implements CompetitorService {
    /**
     * The sign-up collection, read by its documented fields (specs/database-contracts/competition-registration.md) so
     * this package does not depend on {@code registration}, which depends on it. Must match
     * {@code BjjEireCompetitionRegistration.ENTITY_NAME}.
     */
    static final String REGISTRATION_COLLECTION = "BjjEireCompetitionRegistration";

    /** Competitions whose sign-ups no longer hold an account. */
    private static final Set<BjjEireCompetitionStatus> OVER =
            Set.of(BjjEireCompetitionStatus.FINISHED, BjjEireCompetitionStatus.CANCELLED);

    private final MongoTemplate mongoTemplate;
    private final AuditInfoProvider auditInfoProvider;
    private final AuditRecorder auditRecorder;
    private final IdentityDirectory identityDirectory;
    private final Counter directoryFailures;
    private final BjjEireCompetitionService bjjEireCompetitionService;
    private final ApplicationEventPublisher events;
    private final ResultService resultService;

    public CompetitorServiceImpl(
            MongoTemplate mongoTemplate,
            AuditInfoProvider auditInfoProvider,
            AuditRecorder auditRecorder,
            IdentityDirectory identityDirectory,
            MeterRegistry meterRegistry,
            BjjEireCompetitionService bjjEireCompetitionService,
            ApplicationEventPublisher events,
            ResultService resultService) {
        this.mongoTemplate = mongoTemplate;
        this.auditInfoProvider = auditInfoProvider;
        this.auditRecorder = auditRecorder;
        this.identityDirectory = identityDirectory;
        this.bjjEireCompetitionService = bjjEireCompetitionService;
        this.events = events;
        this.resultService = resultService;
        this.directoryFailures = Counter.builder("competitor.identity.deletion.failures")
                .description("Account deletions whose sign-in identity is still in the external tenant")
                .register(meterRegistry);
    }

    @Override
    public CompetitorDto getOwn(CompetitorIdentity caller) {
        Competitor competitor = find(caller);
        return competitor == null ? CompetitorDto.unsaved(caller.email()) : CompetitorMapper.toDto(competitor);
    }

    @Override
    public CompetitorDto saveOwn(CompetitorIdentity caller, SaveCompetitorCommand command) {
        Academy academy = resolveAcademy(caller, command.academy());
        Instant now = auditInfoProvider.currentInstant();
        String user = auditInfoProvider.currentUser();
        Update update = new Update()
                .set("email", caller.email())
                .set("firstName", command.firstName().trim())
                .set("middleName", blankToNull(command.middleName()))
                .set("lastName", command.lastName().trim())
                .set("nationality", command.nationality())
                .set("dateOfBirth", command.dateOfBirth())
                .set("gender", command.gender())
                .set("belt", command.belt())
                .set("academy", academy)
                .set("affiliation", blankToNull(command.affiliation()))
                .set("phone", blankToNull(command.phone()))
                .set("address", trimmed(command.address()))
                .set("updatedAt", now)
                .set("updatedBy", user)
                .setOnInsert("issuer", caller.issuer())
                .setOnInsert("subject", caller.subject())
                .setOnInsert("createdAt", now)
                .setOnInsert("createdBy", user);

        Competitor before;
        try {
            before = upsert(caller, update);
        } catch (DuplicateKeyException raced) {
            // Two first saves raced and the unique index let one insert through; the other now updates it.
            before = upsert(caller, update);
        }
        if (isRevoked(caller)) {
            // The account was deleted while this save was in flight. Undo it, so no profile outlives the deletion.
            mongoTemplate.remove(identityQuery(caller), Competitor.class);
            throw accountDeleted();
        }
        Competitor saved = find(caller);
        if (saved == null) {
            // Removed by a delete between the save and this read: the account is gone.
            throw accountDeleted();
        }
        auditRecorder.record(
                before == null ? AuditAction.Create : AuditAction.Update, Competitor.ENTITY_NAME, saved.getId(), 1);
        events.publishEvent(new CompetitorProfileSaved(SignUpProfile.of(saved)));
        return CompetitorMapper.toDto(saved);
    }

    @Override
    public List<DivisionDto> getEligibleDivisions(CompetitorIdentity caller, String competitionId) {
        BjjEireCompetitionDto competition =
                bjjEireCompetitionService.getPublicById(competitionId).orElseThrow(ApiProblems::notFound);
        RegistrationState state = competition.registrationState();
        if (state != RegistrationState.OPEN && state != RegistrationState.FULL) {
            // A closed competition, or one not open yet, offers no division at all.
            throw ApiProblems.conflict(
                    ProblemTypes.REGISTRATION_NOT_OPEN, "Registration for this competition is not open.");
        }
        SignUpProfile profile = findSignUpProfile(caller)
                .filter(SignUpProfile::profileComplete)
                .orElseThrow(CompetitorServiceImpl::profileIncomplete);
        if (!Eligibility.isAdultOn(profile.dateOfBirth(), competition.date())) {
            throw underEighteen();
        }
        return Eligibility.eligibleDivisions(
                profile.gender(), profile.belt(), profile.dateOfBirth(), competition.divisions(), competition.date());
    }

    @Override
    public Optional<SignUpProfile> findSignUpProfile(CompetitorIdentity caller) {
        return Optional.ofNullable(find(caller)).map(SignUpProfile::of);
    }

    @Override
    public java.util.Map<String, CompetitorContact> findContacts(java.util.Collection<String> competitorIds) {
        if (competitorIds.isEmpty()) {
            return java.util.Map.of();
        }
        return mongoTemplate.find(Query.query(Criteria.where("_id").in(competitorIds)), Competitor.class).stream()
                .collect(java.util.stream.Collectors.toMap(
                        Competitor::getId,
                        competitor -> new CompetitorContact(
                                competitor.getId(),
                                competitor.getEmail(),
                                competitor.getPhone(),
                                competitor.getDateOfBirth(),
                                competitor.getGender(),
                                competitor.getBelt())));
    }

    @Override
    public Optional<String> findEmail(String competitorId) {
        return Optional.ofNullable(mongoTemplate.findById(competitorId, Competitor.class))
                .map(Competitor::getEmail);
    }

    /** The 409 a sign-up gets when the profile lacks something it needs (FR-015). */
    public static ResponseStatusException profileIncomplete() {
        return ApiProblems.conflict(
                ProblemTypes.PROFILE_INCOMPLETE,
                "Complete your profile (name, nationality, date of birth, gender and belt) before signing up.");
    }

    /** The 409 a sign-up gets from someone under 18 on the competition day (FR-017). */
    public static ResponseStatusException underEighteen() {
        return ApiProblems.conflict(
                ProblemTypes.UNDER_18,
                "You must be " + Eligibility.MINIMUM_AGE + " or over on the competition day to compete.");
    }

    @Override
    public CompetitorHistoryDto getOwnHistory(CompetitorIdentity caller) {
        Competitor competitor = find(caller);
        if (competitor == null) {
            return CompetitorHistoryDto.empty();
        }
        // Entered means confirmed: a cancelled, expired or unpaid sign-up never competed (FR-039).
        Query query = Query.query(Criteria.where("competitorId")
                .in(competitorIds(competitor.getId()))
                .and("status")
                .is("CONFIRMED"));
        query.fields().include("_id", "competitionId");
        List<ResultService.SignUpRef> signUps =
                mongoTemplate.find(query, Document.class, REGISTRATION_COLLECTION).stream()
                        .map(document -> new ResultService.SignUpRef(
                                document.getString("competitionId"), hex(document.get("_id"))))
                        .toList();
        List<CompetitionMedals> medals = resultService.medalsFor(signUps);
        return new CompetitorHistoryDto(
                medals.stream().mapToInt(CompetitionMedals::gold).sum(),
                medals.stream().mapToInt(CompetitionMedals::silver).sum(),
                medals.stream().mapToInt(CompetitionMedals::bronze).sum(),
                medals.stream()
                        .map(entry -> new CompetitorHistoryDto.CompetitionMedalsDto(
                                entry.competitionId(),
                                entry.slug(),
                                entry.name(),
                                entry.date(),
                                entry.gold(),
                                entry.silver(),
                                entry.bronze()))
                        .toList());
    }

    @Override
    public void deleteOwn(CompetitorIdentity caller) {
        Competitor competitor = find(caller);
        if (competitor != null && hasActiveRegistration(competitor.getId())) {
            throw ApiProblems.conflict(
                    ProblemTypes.HAS_ACTIVE_REGISTRATION,
                    "You have a sign-up that is awaiting payment or confirmed. Cancel it before deleting your account.");
        }

        if (competitor != null) {
            // Before anything else changes: if anonymising the sign-ups fails, the account is untouched and the
            // deletion can be retried.
            events.publishEvent(new CompetitorAccountDeleting(competitor.getId()));
        }

        // First stop the identity at the API, so nothing it sends from here on is accepted.
        DeletedCompetitor tombstone = revoke(caller);
        // By identity, not the copy read above: a first save that raced this delete is removed too. Any save
        // after this point finds the tombstone and undoes itself.
        mongoTemplate.remove(identityQuery(caller), Competitor.class);
        auditRecorder.record(
                AuditAction.Delete, Competitor.ENTITY_NAME, competitor == null ? null : competitor.getId(), 1);

        try {
            identityDirectory.deleteUser(caller.objectId());
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("_id").is(tombstone.getId())),
                    Update.update("directoryDeleted", true),
                    DeletedCompetitor.class);
        } catch (IdentityDirectory.IdentityDirectoryException failed) {
            // The account is gone and its tokens are refused; the identity has to be removed from the tenant by hand.
            directoryFailures.increment();
            log.error(
                    "Competitor account {} deleted, but its sign-in identity is still in the external tenant: {}",
                    tombstone.getId(),
                    failed.getMessage());
        }
    }

    private DeletedCompetitor revoke(CompetitorIdentity caller) {
        Query query = Query.query(
                Criteria.where("issuer").is(caller.issuer()).and("subject").is(caller.subject()));
        Update update = new Update()
                .setOnInsert("issuer", caller.issuer())
                .setOnInsert("subject", caller.subject())
                // Set on every deletion: someone who signed up again and deletes again ends the new sessions too.
                .set("deletedAt", auditInfoProvider.currentInstant())
                .set("directoryDeleted", false);
        FindAndModifyOptions options =
                FindAndModifyOptions.options().upsert(true).returnNew(true);
        try {
            return mongoTemplate.findAndModify(query, update, options, DeletedCompetitor.class);
        } catch (DuplicateKeyException raced) {
            return mongoTemplate.findAndModify(query, update, options, DeletedCompetitor.class);
        }
    }

    private boolean isRevoked(CompetitorIdentity caller) {
        return new MongoRevokedCompetitors(mongoTemplate)
                .isRevoked(caller.issuer(), caller.subject(), caller.issuedAt());
    }

    private static ResponseStatusException accountDeleted() {
        AccountDeletedException exception = new AccountDeletedException();
        exception.setType(ProblemTypes.UNAUTHORIZED);
        exception.setTitle("Unauthorized");
        return exception;
    }

    /** A 401 carrying {@code WWW-Authenticate: Bearer}, like every other 401 the API sends. */
    private static final class AccountDeletedException extends ResponseStatusException {
        private static final long serialVersionUID = 1L;

        AccountDeletedException() {
            super(HttpStatus.UNAUTHORIZED, "This competitor account has been deleted.");
        }

        @Override
        public org.springframework.http.HttpHeaders getHeaders() {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set(org.springframework.http.HttpHeaders.WWW_AUTHENTICATE, "Bearer");
            return headers;
        }
    }

    private Competitor upsert(CompetitorIdentity caller, Update update) {
        return mongoTemplate.findAndModify(
                identityQuery(caller),
                update,
                FindAndModifyOptions.options().upsert(true).returnNew(false),
                Competitor.class);
    }

    private Competitor find(CompetitorIdentity caller) {
        return mongoTemplate.findOne(identityQuery(caller), Competitor.class);
    }

    /**
     * Whether a sign-up still holds the account: awaiting payment or confirmed, in a competition that has not finished
     * or been cancelled. A confirmed sign-up stays active after its competition finishes, and one a result names can no
     * longer be cancelled (FR-026), so a finished competition must not keep a medallist from deleting their account
     * (FR-013). A sign-up whose competition cannot be found still blocks: the guard never fails open.
     */
    private boolean hasActiveRegistration(String competitorId) {
        Query active = Query.query(Criteria.where("competitorId")
                .in(competitorIds(competitorId))
                .and("active")
                .is(true));
        active.fields().include("competitionId");
        Set<String> competitionIds = new HashSet<>();
        for (Document signUp : mongoTemplate.find(active, Document.class, REGISTRATION_COLLECTION)) {
            Object competitionId = signUp.get("competitionId");
            if (competitionId == null) {
                return true;
            }
            competitionIds.add(String.valueOf(competitionId));
        }
        if (competitionIds.isEmpty()) {
            return false;
        }
        long over = mongoTemplate.count(
                Query.query(
                        Criteria.where("_id").in(competitionIds).and("status").in(OVER)),
                BjjEireCompetition.class);
        return over < competitionIds.size();
    }

    /** Sign-ups store the link as a string; an ObjectId is matched too, so a lookup never misses one. */
    private static List<Object> competitorIds(String competitorId) {
        return ObjectId.isValid(competitorId)
                ? List.of(competitorId, new ObjectId(competitorId))
                : List.of(competitorId);
    }

    private static String hex(Object id) {
        return id instanceof ObjectId objectId ? objectId.toHexString() : String.valueOf(id);
    }

    private Academy resolveAcademy(CompetitorIdentity caller, SaveCompetitorCommand.AcademyChoice choice) {
        if (choice == null) {
            return null;
        }
        if (choice.gymId() != null) {
            Gym gym = mongoTemplate.findById(choice.gymId(), Gym.class);
            if (gym == null || gym.getStatus() != GymStatus.Active) {
                // A gym chosen while it was listed stays, so leaving the directory does not block later saves.
                Competitor existing = find(caller);
                if (existing != null
                        && existing.getAcademy() != null
                        && choice.gymId().equals(existing.getAcademy().gymId())) {
                    return existing.getAcademy();
                }
                throw ApiProblems.validation(
                        "Academy.GymId", "There is no gym with this id in the directory.", "UNKNOWN_GYM");
            }
            return new Academy(gym.getId(), gym.getName());
        }
        return new Academy(null, choice.name().trim());
    }

    private static Query identityQuery(CompetitorIdentity caller) {
        return Query.query(
                Criteria.where("issuer").is(caller.issuer()).and("subject").is(caller.subject()));
    }

    private static PostalAddress trimmed(PostalAddress address) {
        if (address == null) {
            return null;
        }
        PostalAddress result = new PostalAddress(
                blankToNull(address.street()),
                blankToNull(address.postcode()),
                blankToNull(address.city()),
                blankToNull(address.region()),
                blankToNull(address.country()));
        boolean empty = result.street() == null
                && result.postcode() == null
                && result.city() == null
                && result.region() == null
                && result.country() == null;
        return empty ? null : result;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
