package com.bjjeire.api.registration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Fallback for a missed {@code checkout.session.expired} event (research R4): ends lapsed unpaid holds. Safe on several
 * pods at once, because each sign-up is expired by a guarded single-document update.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HoldSweep {
    private final RegistrationService registrationService;

    @Scheduled(
            initialDelayString = "${bjjeire.registration.hold-sweep-initial-delay:PT1M}",
            fixedDelayString = "${bjjeire.registration.hold-sweep-interval:PT1M}")
    public void sweep() {
        try {
            int expired = registrationService.expireLapsedHolds();
            if (expired > 0) {
                log.info("Hold sweep expired {} unpaid sign-up(s)", expired);
            }
        } catch (RuntimeException failed) {
            log.error("Hold sweep failed", failed);
        }
    }
}
