package com.bjjeire.api.registration;

import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionDto;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionService;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus;
import com.bjjeire.api.bjjeirecompetition.DivisionDto;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.competitor.CompetitorProfileSaved;
import com.bjjeire.api.competitor.CompetitorService;
import com.bjjeire.api.competitor.SignUpProfile;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Copies a competitor's new name, academy and affiliation to their active sign-ups in competitions still running, and
 * flags a sign-up whose division no longer fits their belt or gender (research R8, spec edge case). The division is
 * never changed for them.
 *
 * <p>Runs after the profile save commits, in a transaction of its own, from the event publication registry (ADR-0017).
 * A failure leaves the publication incomplete and {@code config.EventPublicationSweep} resubmits it. It reads the
 * profile as it is now, so running it again, or after a later save, is harmless.
 */
@Component
@RequiredArgsConstructor
class RegistrationProfileListener {
    private final MongoTemplate mongoTemplate;
    private final BjjEireCompetitionService bjjEireCompetitionService;
    private final ApiCache cache;
    private final CompetitorService competitorService;

    @ApplicationModuleListener
    void onProfileSaved(CompetitorProfileSaved event) {
        // Gone: the account was deleted after the save, and RegistrationAnonymiser has dealt with its sign-ups.
        competitorService.findSignUpProfileById(event.competitorId()).ifPresent(this::propagate);
    }

    private void propagate(SignUpProfile profile) {
        List<BjjEireCompetitionRegistration> active = mongoTemplate.find(
                Query.query(Criteria.where("competitorId")
                        .is(profile.competitorId())
                        .and("active")
                        .is(true)),
                BjjEireCompetitionRegistration.class);
        if (active.isEmpty()) {
            return;
        }
        Map<String, Optional<BjjEireCompetitionDto>> competitions = active.stream()
                .map(BjjEireCompetitionRegistration::getCompetitionId)
                .distinct()
                .collect(Collectors.toMap(id -> id, bjjEireCompetitionService::getForAdmin));
        for (BjjEireCompetitionRegistration registration : active) {
            Optional<BjjEireCompetitionDto> competition = competitions.get(registration.getCompetitionId());
            if (competition.isEmpty()
                    || competition.get().status() == BjjEireCompetitionStatus.FINISHED
                    || competition.get().status() == BjjEireCompetitionStatus.CANCELLED) {
                continue;
            }
            boolean mismatch = competition.get().divisions().stream()
                    .filter(division -> division.id().equals(registration.getDivisionId()))
                    .findFirst()
                    .map(division -> !fits(division, profile))
                    .orElse(false);
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("_id")
                            .is(registration.getId())
                            .and("active")
                            .is(true)),
                    new Update()
                            .set("displayName", profile.displayName())
                            .set("academy", profile.academy())
                            .set("affiliation", profile.affiliation())
                            .set("academyKey", TeamKeys.academyKey(profile.academy()))
                            .set("affiliationKey", TeamKeys.affiliationKey(profile.affiliation()))
                            .set("profileMismatch", mismatch),
                    BjjEireCompetitionRegistration.class);
        }
        cache.removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
    }

    private static boolean fits(DivisionDto division, SignUpProfile profile) {
        return division.gender() == profile.gender() && division.belt() == profile.belt();
    }
}
