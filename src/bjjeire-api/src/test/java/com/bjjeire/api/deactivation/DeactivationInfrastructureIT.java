package com.bjjeire.api.deactivation;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditLogEntry;
import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.competition.CompetitionDeactivator;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.event.BjjEventDeactivator;
import com.bjjeire.api.event.BjjEventSchedule;
import com.bjjeire.api.event.ScheduleKind;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.index.IndexInfo;

class DeactivationInfrastructureIT extends MongoIntegrationTest {
    @Autowired
    private BjjEventDeactivator bjjEventDeactivator;

    @Autowired
    private CompetitionDeactivator competitionDeactivator;

    @Autowired
    private Clock clock;

    @Test
    void shouldEnsureCatalogIndexesIncludingTtlAndUniqueSlugOnStartup() {
        List<String> eventIndexes = mongoTemplate.indexOps("BjjEvent").getIndexInfo().stream()
                .map(IndexInfo::getName)
                .toList();
        List<IndexInfo> competitionIndexes =
                mongoTemplate.indexOps("Competition").getIndexInfo();

        assertThat(eventIndexes)
                .contains("ix_event_isActive_endDate", "ix_event_county_isActive", "ttl_event_expiresAt");
        assertThat(mongoTemplate.indexOps("Gym").getIndexInfo())
                .anyMatch(index -> index.getName().equals("ix_gym_status_county_name"));
        assertThat(mongoTemplate.indexOps("Store").getIndexInfo())
                .anyMatch(index -> index.getName().equals("ix_store_isActive_name"));

        IndexInfo eventTtl = mongoTemplate.indexOps("BjjEvent").getIndexInfo().stream()
                .filter(index -> index.getName().equals("ttl_event_expiresAt"))
                .findFirst()
                .orElseThrow();
        assertThat(eventTtl.getExpireAfter()).contains(Duration.ZERO);

        assertThat(competitionIndexes)
                .anyMatch(index -> index.getName().equals("ix_competition_isActive_endDate"))
                .anyMatch(index -> index.getName().equals("ttl_competition_expiresAt"))
                .anyMatch(index -> index.getName().equals("ix_competition_slug_unique") && index.isUnique());
    }

    @Test
    void shouldGrantSingleLeaseHolderAndHonourLeaseExpiry() {
        Clock fixedNow = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
        MongoLeaderElection replicaA = new MongoLeaderElection(mongoTemplate, fixedNow, "replica-a");
        MongoLeaderElection replicaB = new MongoLeaderElection(mongoTemplate, fixedNow, "replica-b");

        assertThat(replicaA.tryAcquire("BjjEvent", Duration.ofMinutes(10))).isTrue();
        assertThat(replicaB.tryAcquire("BjjEvent", Duration.ofMinutes(10))).isFalse();
        // The current holder can renew its own lease.
        assertThat(replicaA.tryAcquire("BjjEvent", Duration.ofMinutes(10))).isTrue();
        // A different lock name is an independent lease.
        assertThat(replicaB.tryAcquire("Competition", Duration.ofMinutes(10))).isTrue();

        // Once the lease expires, another replica can take over.
        Clock afterExpiry = Clock.fixed(FIXED_NOW.plus(Duration.ofMinutes(11)), ZoneOffset.UTC);
        MongoLeaderElection lateReplicaB = new MongoLeaderElection(mongoTemplate, afterExpiry, "replica-b");
        assertThat(lateReplicaB.tryAcquire("BjjEvent", Duration.ofMinutes(10))).isTrue();
    }

    @Test
    void shouldDeactivateOnlyExpiredActiveEventsAndWriteAuditLog() {
        mongoTemplate.save(event("202605310000000000000101", true, "2026-01-01T12:00:00Z"));
        mongoTemplate.save(event("202605310000000000000102", true, "2026-08-01T12:00:00Z"));
        mongoTemplate.save(event("202605310000000000000103", false, "2026-01-01T12:00:00Z"));
        mongoTemplate.save(event("202605310000000000000104", true, null));

        long deactivated = bjjEventDeactivator.deactivateExpired(clock.instant());

        assertThat(deactivated).isEqualTo(1);
        BjjEvent flipped = mongoTemplate.findById("202605310000000000000101", BjjEvent.class);
        assertThat(flipped.isActive()).isFalse();
        assertThat(flipped.getUpdatedOnUtc()).isEqualTo(FIXED_NOW);
        assertThat(flipped.getUpdatedBy()).isEqualTo("system");
        assertThat(mongoTemplate
                        .findById("202605310000000000000102", BjjEvent.class)
                        .isActive())
                .isTrue();
        assertThat(mongoTemplate
                        .findById("202605310000000000000104", BjjEvent.class)
                        .isActive())
                .isTrue();

        List<AuditLogEntry> auditEntries = mongoTemplate.findAll(AuditLogEntry.class);
        assertThat(auditEntries)
                .anyMatch(entry -> entry.getAction() == AuditAction.UpdateMany
                        && entry.getEntityType().equals("BjjEvent")
                        && entry.getAffectedCount() == 1
                        && entry.getActor().equals("system"));
    }

    @Test
    void shouldDeactivateOnlyExpiredActiveCompetitions() {
        mongoTemplate.save(competition("202605310000000000000201", "past-open", true, "2026-01-01T12:00:00Z"));
        mongoTemplate.save(competition("202605310000000000000202", "future-open", true, "2026-08-01T12:00:00Z"));
        mongoTemplate.save(competition("202605310000000000000203", "dateless-open", true, null));

        long deactivated = competitionDeactivator.deactivateExpired(clock.instant());

        assertThat(deactivated).isEqualTo(1);
        assertThat(mongoTemplate
                        .findById("202605310000000000000201", Competition.class)
                        .isActive())
                .isFalse();
        assertThat(mongoTemplate
                        .findById("202605310000000000000202", Competition.class)
                        .isActive())
                .isTrue();
        assertThat(mongoTemplate
                        .findById("202605310000000000000203", Competition.class)
                        .isActive())
                .isTrue();
    }

    private static BjjEvent event(String id, boolean isActive, String endDate) {
        BjjEvent event = new BjjEvent();
        event.setId(id);
        event.setName("event-" + id);
        event.setSchedule(new BjjEventSchedule(
                ScheduleKind.FixedDates,
                endDate != null ? Instant.parse(endDate).minus(Duration.ofHours(2)) : null,
                endDate != null ? Instant.parse(endDate) : null,
                List.of()));
        event.setActive(isActive);
        return event;
    }

    private static Competition competition(String id, String slug, boolean isActive, String endDate) {
        Competition competition = new Competition();
        competition.setId(id);
        competition.setSlug(slug);
        competition.setName("competition-" + slug);
        competition.setEndDate(endDate != null ? Instant.parse(endDate) : null);
        competition.setActive(isActive);
        return competition;
    }
}
