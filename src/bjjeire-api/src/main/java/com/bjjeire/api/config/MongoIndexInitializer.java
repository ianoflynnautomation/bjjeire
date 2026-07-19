package com.bjjeire.api.config;

import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

/**
 * Single source of truth for Mongo indexes. Runs at every startup; creation is idempotent so query performance never
 * depends on the seeder having run. Non-critical failures are logged and skipped; the unique slug constraint is
 * critical and fails startup.
 */
@Component
@Slf4j
@RequiredArgsConstructor
@Order(1)
public class MongoIndexInitializer implements ApplicationRunner {
    private static final Duration EXPIRE_AT_STORED_DATE = Duration.ZERO;

    private final MongoTemplate mongoTemplate;

    @Override
    public void run(ApplicationArguments args) {
        // Seeder --validate / --help are DB-free modes (the seeder exits
        // before touching Mongo there); don't force a connection for them.
        if (args.containsOption("validate") || args.containsOption("help")) {
            log.info("Skipping index ensure — no-database mode requested");
            return;
        }

        dropObsolete("BjjEvent", "ix_event_county_status_endDate");

        ensure(
                "Gym",
                new Index()
                        .on("status", Sort.Direction.ASC)
                        .on("county", Sort.Direction.ASC)
                        .on("name", Sort.Direction.ASC)
                        .named("ix_gym_status_county_name"),
                false);

        ensure(
                "BjjEvent",
                new Index()
                        .on("isActive", Sort.Direction.ASC)
                        .on("schedule.endDate", Sort.Direction.ASC)
                        .named("ix_event_isActive_endDate"),
                false);

        ensure(
                "BjjEvent",
                new Index()
                        .on("county", Sort.Direction.ASC)
                        .on("isActive", Sort.Direction.ASC)
                        .named("ix_event_county_isActive"),
                false);

        ensure(
                "BjjEvent",
                new Index()
                        .on("expiresAt", Sort.Direction.ASC)
                        .named("ttl_event_expiresAt")
                        .expire(EXPIRE_AT_STORED_DATE),
                false);

        ensure(
                "Competition",
                new Index()
                        .on("isActive", Sort.Direction.ASC)
                        .on("endDate", Sort.Direction.ASC)
                        .named("ix_competition_isActive_endDate"),
                false);

        // Unique correctness constraint — critical: a failure to build this must fail fast.
        ensure(
                "Competition",
                new Index()
                        .on("slug", Sort.Direction.ASC)
                        .named("ix_competition_slug_unique")
                        .unique(),
                true);

        ensure(
                "Competition",
                new Index()
                        .on("expiresAt", Sort.Direction.ASC)
                        .named("ttl_competition_expiresAt")
                        .expire(EXPIRE_AT_STORED_DATE),
                false);

        ensure(
                "Store",
                new Index()
                        .on("isActive", Sort.Direction.ASC)
                        .on("name", Sort.Direction.ASC)
                        .named("ix_store_isActive_name"),
                false);

        log.info("All Mongo indexes ensured");
    }

    private void ensure(String collection, Index index, boolean critical) {
        try {
            String created = mongoTemplate.indexOps(collection).ensureIndex(index);
            log.info("Ensured index {} on collection {}", created, collection);
        } catch (RuntimeException exception) {
            if (critical) {
                throw exception;
            }
            log.warn(
                    "Non-critical index {} on collection {} could not be ensured",
                    index.getIndexKeys(),
                    collection,
                    exception);
        }
    }

    private void dropObsolete(String collection, String name) {
        try {
            mongoTemplate.indexOps(collection).dropIndex(name);
            log.info("Retired obsolete index {} on collection {}", name, collection);
        } catch (RuntimeException exception) {
            log.debug("Obsolete index {} on collection {} already absent", name, collection);
        }
    }
}
