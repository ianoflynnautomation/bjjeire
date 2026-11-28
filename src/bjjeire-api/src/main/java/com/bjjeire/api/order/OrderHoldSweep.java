package com.bjjeire.api.order;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Fallback for a missed {@code checkout.session.expired} event (FR-011): ends lapsed unpaid holds and gives their stock
 * back. Safe on several pods at once, because each order is expired by a guarded single-document update.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderHoldSweep {
    private final OrderService orderService;

    @Scheduled(
            initialDelayString = "${bjjeire.order.hold-sweep-initial-delay:PT1M}",
            fixedDelayString = "${bjjeire.order.hold-sweep-interval:PT1M}")
    public void sweep() {
        try {
            int expired = orderService.expireLapsedHolds();
            if (expired > 0) {
                log.info("Order hold sweep expired {} unpaid order(s)", expired);
            }
        } catch (RuntimeException failed) {
            log.error("Order hold sweep failed", failed);
        }
    }
}
