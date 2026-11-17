package com.bjjeire.api.registration;

import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.competitor.CompetitorAccountDeleting;
import java.time.Clock;
import java.time.Instant;
import java.time.Period;
import java.time.ZoneOffset;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * Anonymises a deleting competitor's sign-ups (research R11, FR-013): the name becomes a fixed placeholder, the link to
 * the profile is removed and the sign-up no longer counts as active. The division, academy, affiliation and any medal
 * stay, so team points are kept. Payment and refund records stay for {@link #FINANCIAL_RETENTION}, then
 * {@link FinancialRecordsSweep} removes them. Runs inside the deletion: a failure here stops it before anything else
 * changed.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class RegistrationAnonymiser {
    /** The owner's decision, 2026-11-13. */
    static final Period FINANCIAL_RETENTION = Period.ofYears(6);

    private final MongoTemplate mongoTemplate;
    private final ApiCache cache;
    private final Clock clock;

    @EventListener
    void onAccountDeleting(CompetitorAccountDeleting event) {
        String competitorId = event.competitorId();
        // Stored as a string; an ObjectId is matched too, as the deletion guard does.
        List<Object> ids = ObjectId.isValid(competitorId)
                ? List.of(competitorId, new ObjectId(competitorId))
                : List.of(competitorId);
        Instant expireAt = clock.instant()
                .atOffset(ZoneOffset.UTC)
                .plus(FINANCIAL_RETENTION)
                .toInstant();
        long anonymised = mongoTemplate
                .updateMulti(
                        Query.query(Criteria.where("competitorId").in(ids)),
                        // Ends `active` too: an account goes only once its active sign-ups are in finished or
                        // cancelled competitions, where they hold no place. Left set, two anonymised sign-ups in
                        // one division would collide on ux_registration_active_competitor_division (null link).
                        new Update()
                                .unset("competitorId")
                                .unset("active")
                                .set("displayName", BjjEireCompetitionRegistration.DELETED_DISPLAY_NAME)
                                .set("financialRecordsExpireAt", expireAt),
                        BjjEireCompetitionRegistration.class)
                .getModifiedCount();
        cache.removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
        log.info("{} sign-up(s) anonymised for a deleted account; payment records kept until {}", anonymised, expireAt);
    }
}
