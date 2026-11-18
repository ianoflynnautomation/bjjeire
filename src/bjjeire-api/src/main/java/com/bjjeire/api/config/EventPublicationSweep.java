package com.bjjeire.api.config;

import java.time.Duration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.modulith.events.IncompleteEventPublications;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Resubmits event publications whose listener failed or never finished (ADR-0017), so after-commit work such as a
 * profile change reaching its sign-ups is retried rather than lost. Only publications older than the grace period are
 * resubmitted, so a first delivery still in flight is left alone.
 *
 * <p>Several pods may resubmit the same publication at once. Every {@code @ApplicationModuleListener} must therefore be
 * safe to run twice.
 */
@Slf4j
@Component
public class EventPublicationSweep {
    private final IncompleteEventPublications incompletePublications;
    private final Duration gracePeriod;

    public EventPublicationSweep(
            IncompleteEventPublications incompletePublications,
            @Value("${bjjeire.events.resubmit-older-than:PT5M}") Duration gracePeriod) {
        this.incompletePublications = incompletePublications;
        this.gracePeriod = gracePeriod;
    }

    @Scheduled(
            initialDelayString = "${bjjeire.events.resubmit-initial-delay:PT1M}",
            fixedDelayString = "${bjjeire.events.resubmit-interval:PT5M}")
    public void sweep() {
        try {
            resubmitOlderThan(gracePeriod);
        } catch (RuntimeException failed) {
            log.error("Event publication sweep failed", failed);
        }
    }

    /**
     * Resubmits every incomplete publication older than the given age.
     *
     * @param age how long a publication must have been outstanding
     */
    public void resubmitOlderThan(Duration age) {
        incompletePublications.resubmitIncompletePublicationsOlderThan(age);
    }
}
