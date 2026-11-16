package com.bjjeire.api.registration;

import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.competitor.CompetitorProfileSaved;
import com.bjjeire.api.competitor.SignUpProfile;
import com.bjjeire.api.tournament.DivisionDto;
import com.bjjeire.api.tournament.TournamentDto;
import com.bjjeire.api.tournament.TournamentService;
import com.bjjeire.api.tournament.TournamentStatus;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * Copies a competitor's new name, academy and affiliation to their active sign-ups in tournaments still running, and
 * flags a sign-up whose division no longer fits their belt or gender (research R8, spec edge case). The division is
 * never changed for them.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class RegistrationProfileListener {
    private final MongoTemplate mongoTemplate;
    private final TournamentService tournamentService;
    private final ApiCache cache;

    @EventListener
    void onProfileSaved(CompetitorProfileSaved event) {
        SignUpProfile profile = event.profile();
        try {
            propagate(profile);
        } catch (RuntimeException failed) {
            // The profile is saved; a sign-up keeps its older snapshot until the next save.
            log.error("Profile change of competitor {} not copied to its sign-ups", profile.competitorId(), failed);
        }
    }

    private void propagate(SignUpProfile profile) {
        List<TournamentRegistration> active = mongoTemplate.find(
                Query.query(Criteria.where("competitorId")
                        .is(profile.competitorId())
                        .and("active")
                        .is(true)),
                TournamentRegistration.class);
        if (active.isEmpty()) {
            return;
        }
        Map<String, Optional<TournamentDto>> tournaments = active.stream()
                .map(TournamentRegistration::getTournamentId)
                .distinct()
                .collect(Collectors.toMap(id -> id, tournamentService::getForAdmin));
        for (TournamentRegistration registration : active) {
            Optional<TournamentDto> tournament = tournaments.get(registration.getTournamentId());
            if (tournament.isEmpty()
                    || tournament.get().status() == TournamentStatus.FINISHED
                    || tournament.get().status() == TournamentStatus.CANCELLED) {
                continue;
            }
            boolean mismatch = tournament.get().divisions().stream()
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
                    TournamentRegistration.class);
        }
        cache.removeByTag(ApiCache.TOURNAMENTS_TAG);
    }

    private static boolean fits(DivisionDto division, SignUpProfile profile) {
        return division.gender() == profile.gender() && division.belt() == profile.belt();
    }
}
