package com.bjjeire.api.registration;

import java.time.Clock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Removes payment and refund records six years after the competitor deleted their account (FR-013). Leaves the
 * anonymised sign-up, its division and any medal. Uses {@code ix_registration_financialRecordsExpireAt}; one update, so
 * it is safe on several pods at once.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FinancialRecordsSweep {
    private final MongoTemplate mongoTemplate;
    private final Clock clock;

    /**
     * Removes the payment records whose retention has ended.
     *
     * @return how many sign-ups lost their payment records in this run
     */
    @Scheduled(
            initialDelayString = "${bjjeire.registration.retention-sweep-initial-delay:PT10M}",
            fixedDelayString = "${bjjeire.registration.retention-sweep-interval:PT24H}")
    public int sweep() {
        try {
            long removed = mongoTemplate
                    .updateMulti(
                            Query.query(Criteria.where("financialRecordsExpireAt")
                                    .lt(clock.instant())
                                    .orOperator(
                                            Criteria.where("payment").exists(true),
                                            Criteria.where("refund").exists(true))),
                            new Update().unset("payment").unset("refund"),
                            BjjEireCompetitionRegistration.class)
                    .getModifiedCount();
            if (removed > 0) {
                log.info("Retention sweep removed the payment records of {} sign-up(s)", removed);
            }
            return (int) removed;
        } catch (RuntimeException failed) {
            log.error("Retention sweep failed", failed);
            return 0;
        }
    }
}
