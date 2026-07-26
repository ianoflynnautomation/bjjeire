package com.bjjeire.api.deactivation;

import com.bjjeire.api.config.DeactivationProperties;
import java.time.Clock;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class PeriodicDeactivationScheduler {
    private final List<Deactivator> deactivators;
    private final MongoLeaderElection leaderElection;
    private final DeactivationProperties properties;
    private final Clock clock;

    @Scheduled(
            initialDelayString = "${bjjeire.deactivation.initial-delay:PT30S}",
            fixedDelayString = "${bjjeire.deactivation.interval:PT24H}")
    public void sweepAll() {
        if (!properties.enabled()) {
            return;
        }
        deactivators.forEach(this::sweep);
    }

    void sweep(Deactivator deactivator) {
        String entityName = deactivator.entityName();
        try {
            if (!leaderElection.tryAcquire(entityName, properties.leaseDuration())) {
                log.debug("Deactivation sweep for {} skipped — another replica holds the lease", entityName);
                return;
            }

            long deactivated = deactivator.deactivateExpired(clock.instant());
            log.info("Deactivation sweep for {} completed — {} document(s) deactivated", entityName, deactivated);
        } catch (RuntimeException exception) {
            log.error("Deactivation sweep for {} failed", entityName, exception);
        }
    }
}
