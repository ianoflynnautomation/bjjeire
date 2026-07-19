package com.bjjeire.api.deactivation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import com.bjjeire.api.config.DeactivationProperties;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PeriodicDeactivationSchedulerTest {
    private static final Instant NOW = Instant.parse("2026-07-18T06:00:00Z");
    private static final Duration LEASE = Duration.ofMinutes(10);

    @Mock
    private MongoLeaderElection leaderElection;

    @Mock
    private Deactivator eventDeactivator;

    @Mock
    private Deactivator competitionDeactivator;

    private PeriodicDeactivationScheduler scheduler(boolean enabled) {
        return new PeriodicDeactivationScheduler(
                List.of(eventDeactivator, competitionDeactivator),
                leaderElection,
                new DeactivationProperties(enabled, Duration.ofSeconds(30), Duration.ofHours(24), LEASE),
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private void givenNamedDeactivators() {
        given(eventDeactivator.entityName()).willReturn("BjjEvent");
        given(competitionDeactivator.entityName()).willReturn("Competition");
    }

    @Test
    void shouldRunEachDeactivatorWhenLeaseIsAcquired() {
        givenNamedDeactivators();
        given(leaderElection.tryAcquire(anyString(), any())).willReturn(true);

        scheduler(true).sweepAll();

        then(eventDeactivator).should().deactivateExpired(NOW);
        then(competitionDeactivator).should().deactivateExpired(NOW);
        then(leaderElection).should().tryAcquire(eq("BjjEvent"), eq(LEASE));
        then(leaderElection).should().tryAcquire(eq("Competition"), eq(LEASE));
    }

    @Test
    void shouldSkipEntitiesWhenAnotherReplicaHoldsTheLease() {
        givenNamedDeactivators();
        given(leaderElection.tryAcquire(anyString(), any())).willReturn(false);

        scheduler(true).sweepAll();

        then(eventDeactivator).should(never()).deactivateExpired(any());
        then(competitionDeactivator).should(never()).deactivateExpired(any());
    }

    @Test
    void shouldDoNothingWhenSweepingIsDisabled() {
        scheduler(false).sweepAll();

        then(leaderElection).should(never()).tryAcquire(anyString(), any());
    }

    @Test
    void shouldContinueWithRemainingEntitiesWhenOneSweepFails() {
        givenNamedDeactivators();
        given(leaderElection.tryAcquire(anyString(), any())).willReturn(true);
        given(eventDeactivator.deactivateExpired(any())).willThrow(new IllegalStateException("mongo down"));

        scheduler(true).sweepAll();

        then(competitionDeactivator).should().deactivateExpired(NOW);
    }
}
