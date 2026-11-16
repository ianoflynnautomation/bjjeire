package com.bjjeire.api.registration;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionDto;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionService;
import com.bjjeire.api.bjjeirecompetition.DivisionDto;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PagedResponses;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.competitor.Academy;
import com.bjjeire.api.competitor.CompetitorContact;
import com.bjjeire.api.competitor.CompetitorService;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

/** Mongo implementation of {@link RegistrationAdminService}. */
@Slf4j
@Service
@RequiredArgsConstructor
public class RegistrationAdminServiceImpl implements RegistrationAdminService {
    private static final Sort OLDEST_FIRST = Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("_id"));

    private final MongoTemplate mongoTemplate;
    private final BjjEireCompetitionService bjjEireCompetitionService;
    private final CompetitorService competitorService;
    private final RegistrationSupport support;
    private final AuditRecorder auditRecorder;
    private final ApiCache cache;

    @Override
    public PagedResponse<AdminRegistrationDto> list(String competitionId, PaginationRequest paginationRequest) {
        BjjEireCompetitionDto competition = competition(competitionId);
        Query query = byBjjEireCompetition(competitionId);
        long total = mongoTemplate.count(query, BjjEireCompetitionRegistration.class);
        query.with(PageRequest.of(paginationRequest.page() - 1, paginationRequest.pageSize(), OLDEST_FIRST));
        return PagedResponses.of(
                rows(competition, mongoTemplate.find(query, BjjEireCompetitionRegistration.class)),
                paginationRequest,
                total);
    }

    @Override
    public String exportCsv(String competitionId) {
        BjjEireCompetitionDto competition = competition(competitionId);
        List<BjjEireCompetitionRegistration> all = mongoTemplate.find(
                byBjjEireCompetition(competitionId).with(OLDEST_FIRST), BjjEireCompetitionRegistration.class);
        return RegistrationCsv.write(rows(competition, all));
    }

    @Override
    public AdminRegistrationDto move(String competitionId, String registrationId, ChangeDivisionCommand command) {
        BjjEireCompetitionDto competition = competition(competitionId);
        BjjEireCompetitionRegistration registration =
                mongoTemplate.findById(registrationId, BjjEireCompetitionRegistration.class);
        if (registration == null || !competitionId.equals(registration.getCompetitionId())) {
            throw ApiProblems.notFound();
        }
        DivisionDto target =
                RegistrationSupport.division(competition, command.divisionId()).orElseThrow(ApiProblems::notFound);
        if (registration.getStatus() != RegistrationStatus.CONFIRMED) {
            throw ApiProblems.conflict(ProblemTypes.CONFLICT, "Only a confirmed sign-up can be moved.");
        }
        CompetitorContact contact = registration.getCompetitorId() == null
                ? null
                : competitorService
                        .findContacts(List.of(registration.getCompetitorId()))
                        .get(registration.getCompetitorId());
        boolean mismatch = contact != null && (contact.gender() != target.gender() || contact.belt() != target.belt());
        BjjEireCompetitionRegistration moved = target.id().equals(registration.getDivisionId())
                ? registration
                : support.move(registration, target.id(), mismatch);
        log.info("Sign-up {} moved by the organiser to division {}", registrationId, target.id());
        return rows(competition, List.of(moved)).getFirst();
    }

    @Override
    public TeamMergeDto mergeTeams(String competitionId, MergeTeamsCommand command) {
        competition(competitionId);
        Criteria matching = Criteria.where("competitionId").is(competitionId);
        Update update = support.audited(new Update());
        if (command.kind() == TeamKind.ACADEMY) {
            if (command.targetGymId() != null && mongoTemplate.findById(command.targetGymId(), Gym.class) == null) {
                throw ApiProblems.validation(
                        "TargetGymId", "There is no gym with this id in the directory.", "UNKNOWN_GYM");
            }
            Academy academy =
                    new Academy(command.targetGymId(), command.target().trim());
            matching.and("academyKey").in(command.fromKeys());
            update.set("academy", academy).set("academyKey", TeamKeys.academyKey(academy));
        } else {
            if (command.targetGymId() != null) {
                throw ApiProblems.validation(
                        "TargetGymId", "An affiliation is not a directory gym.", "GYM_NOT_ALLOWED");
            }
            String affiliation = command.target().trim();
            matching.and("affiliationKey").in(command.fromKeys());
            update.set("affiliation", affiliation).set("affiliationKey", TeamKeys.affiliationKey(affiliation));
        }
        long updated = mongoTemplate
                .updateMulti(Query.query(matching), update, BjjEireCompetitionRegistration.class)
                .getMatchedCount();
        auditRecorder.record(
                AuditAction.UpdateMany, BjjEireCompetitionRegistration.ENTITY_NAME, competitionId, updated);
        cache.removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
        log.info(
                "{} names {} merged into \"{}\" on {} sign-up(s) of competition {}",
                command.kind(),
                command.fromKeys(),
                command.target(),
                updated,
                competitionId);
        return new TeamMergeDto((int) updated);
    }

    private BjjEireCompetitionDto competition(String competitionId) {
        return bjjEireCompetitionService.getForAdmin(competitionId).orElseThrow(ApiProblems::notFound);
    }

    private static Query byBjjEireCompetition(String competitionId) {
        return Query.query(Criteria.where("competitionId").is(competitionId));
    }

    private List<AdminRegistrationDto> rows(
            BjjEireCompetitionDto competition, List<BjjEireCompetitionRegistration> registrations) {
        Map<String, CompetitorContact> contacts = competitorService.findContacts(registrations.stream()
                .map(BjjEireCompetitionRegistration::getCompetitorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));
        return registrations.stream()
                .map(registration -> row(competition, registration, contacts.get(registration.getCompetitorId())))
                .toList();
    }

    private static AdminRegistrationDto row(
            BjjEireCompetitionDto competition, BjjEireCompetitionRegistration registration, CompetitorContact contact) {
        Payment payment = registration.getPayment();
        return new AdminRegistrationDto(
                registration.getId(),
                registration.getDisplayName(),
                contact == null ? null : contact.email(),
                contact == null ? null : contact.phone(),
                contact == null ? null : contact.dateOfBirth(),
                contact == null ? null : contact.gender(),
                contact == null ? null : contact.belt(),
                registration.getAcademy() == null
                        ? null
                        : registration.getAcademy().name(),
                registration.getAffiliation(),
                registration.getAcademyKey(),
                registration.getAffiliationKey(),
                RegistrationSupport.division(competition, registration.getDivisionId())
                        .orElse(null),
                registration.getStatus(),
                payment == null ? 0 : payment.getAmountCents(),
                payment == null ? null : payment.getStatus(),
                registration.getRefund() == null
                        ? null
                        : registration.getRefund().getStatus(),
                // Only while still unconfirmed: the webhook may arrive after the alert.
                registration.getStatus() == RegistrationStatus.AWAITING_PAYMENT
                        && payment != null
                        && payment.getUnconfirmedAlertedAt() != null,
                registration.isProfileMismatch(),
                registration.getCreatedOnUtc());
    }
}
