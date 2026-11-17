package com.bjjeire.api.registration;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionDto;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionService;
import com.bjjeire.api.bjjeirecompetition.DivisionDto;
import com.bjjeire.api.bjjeirecompetition.ResultService;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.competitor.CompetitorIdentity;
import com.bjjeire.api.competitor.CompetitorService;
import com.bjjeire.api.competitor.SignUpProfile;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/** What the sign-up services share: ownership, the competitor's view of a sign-up, mail, audit and cache. */
@Slf4j
@Component
@RequiredArgsConstructor
class RegistrationSupport {
    private final MongoTemplate mongoTemplate;
    private final BjjEireCompetitionService bjjEireCompetitionService;
    private final CompetitorService competitorService;
    private final RegistrationMailSender mailSender;
    private final AuditInfoProvider auditInfoProvider;
    private final AuditRecorder auditRecorder;
    private final ApiCache cache;
    private final ResultService resultService;

    /**
     * Refuses to cancel or move a sign-up a recorded result names (FR-026, data-model.md): its medal and team points
     * would point at a sign-up no longer in the division. The organiser corrects the result first.
     *
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code result-recorded}
     */
    void refuseIfMedallist(BjjEireCompetitionRegistration registration) {
        if (resultService.isNamedInResult(registration.getCompetitionId(), registration.getId())) {
            throw ApiProblems.conflict(
                    ProblemTypes.RESULT_RECORDED,
                    "A recorded result names this sign-up, so it can no longer be cancelled or moved. The organiser"
                            + " must correct the result first.");
        }
    }

    /** The text of one mail, built once the sign-up's competition and division are known. */
    @FunctionalInterface
    interface MailTemplate {
        MailMessage build(String to, BjjEireCompetitionDto competition, DivisionDto division);
    }

    /**
     * The caller's own sign-up.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 unknown; 403 another competitor's
     */
    BjjEireCompetitionRegistration owned(CompetitorIdentity caller, String registrationId) {
        BjjEireCompetitionRegistration registration =
                mongoTemplate.findById(registrationId, BjjEireCompetitionRegistration.class);
        if (registration == null) {
            throw ApiProblems.notFound();
        }
        String callerId = competitorService
                .findSignUpProfile(caller)
                .map(SignUpProfile::competitorId)
                .orElse(null);
        if (callerId == null || !callerId.equals(registration.getCompetitorId())) {
            throw ApiProblems.forbidden();
        }
        return registration;
    }

    RegistrationDto toDto(BjjEireCompetitionRegistration registration, BjjEireCompetitionDto competition) {
        Payment payment = registration.getPayment();
        return new RegistrationDto(
                registration.getId(),
                registration.getCompetitionId(),
                competition == null ? null : competition.slug(),
                competition == null ? null : competition.name(),
                competition == null ? null : competition.date(),
                competition == null
                        ? null
                        : division(competition, registration.getDivisionId()).orElse(null),
                registration.getStatus(),
                payment == null ? 0 : payment.getAmountCents(),
                payment == null ? null : payment.getCurrency(),
                payment == null ? null : payment.getStatus(),
                registration.getRefund() == null
                        ? null
                        : registration.getRefund().getStatus(),
                registration.getHoldExpiresAt(),
                competition == null ? null : competition.registrationClosesAt(),
                registration.getCreatedOnUtc());
    }

    static Optional<DivisionDto> division(BjjEireCompetitionDto competition, String divisionId) {
        return competition.divisions().stream()
                .filter(division -> division.id().equals(divisionId))
                .findFirst();
    }

    /** Queues a mail to the sign-up's competitor. Call only after the change it reports is saved. */
    void mail(BjjEireCompetitionRegistration registration, MailTemplate template) {
        try {
            Optional<String> to =
                    Optional.ofNullable(registration.getCompetitorId()).flatMap(competitorService::findEmail);
            Optional<BjjEireCompetitionDto> competition =
                    bjjEireCompetitionService.getForAdmin(registration.getCompetitionId());
            if (to.isEmpty() || competition.isEmpty()) {
                log.warn("No mail for registration {}: no competitor email or competition", registration.getId());
                return;
            }
            DivisionDto division =
                    division(competition.get(), registration.getDivisionId()).orElse(null);
            mailSender.send(template.build(to.get(), competition.get(), division));
        } catch (RuntimeException failed) {
            // The change is saved; a failed lookup must not turn it into a 5xx whose retry then sends nothing.
            log.error("Mail for registration {} not queued: {}", registration.getId(), failed.getMessage());
        }
    }

    /**
     * Moves a confirmed sign-up to another division of its competition. Its place, price and payment are unchanged.
     *
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code already-registered} when the competitor
     *     already holds the target division; 409 when the sign-up changed in the meantime
     */
    BjjEireCompetitionRegistration move(
            BjjEireCompetitionRegistration registration, String divisionId, boolean profileMismatch) {
        BjjEireCompetitionRegistration moved;
        try {
            moved = mongoTemplate.findAndModify(
                    Query.query(Criteria.where("_id")
                            .is(registration.getId())
                            .and("status")
                            .is(RegistrationStatus.CONFIRMED)
                            .and("divisionId")
                            .is(registration.getDivisionId())),
                    audited(new Update().set("divisionId", divisionId).set("profileMismatch", profileMismatch)),
                    FindAndModifyOptions.options().returnNew(true),
                    BjjEireCompetitionRegistration.class);
        } catch (DuplicateKeyException held) {
            // ux_registration_active_competitor_division: one active sign-up per competitor and division (FR-020).
            throw ApiProblems.conflict(
                    ProblemTypes.ALREADY_REGISTERED,
                    "There is already a sign-up for this competitor in that division.");
        }
        if (moved == null) {
            throw ApiProblems.conflict(
                    ProblemTypes.CONFLICT, "The sign-up was changed meanwhile. Reload it and try again.");
        }
        afterWrite(AuditAction.Update, moved.getId());
        return moved;
    }

    Update audited(Update update) {
        return update.set("updatedAt", auditInfoProvider.currentInstant())
                .set("updatedBy", auditInfoProvider.currentUser());
    }

    void afterWrite(AuditAction action, String id) {
        auditRecorder.record(action, BjjEireCompetitionRegistration.ENTITY_NAME, id, 1);
        cache.removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
    }
}
