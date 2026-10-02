package com.bjjeire.api.config;

import com.bjjeire.api.common.OpenEndedInstant;
import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.store.Store;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
@Order(1)
public class MongoIndexInitializer implements ApplicationRunner {
    private static final Duration EXPIRE_AT_STORED_DATE = Duration.ZERO;

    private final MongoTemplate mongoTemplate;

    @Override
    public void run(ApplicationArguments args) {

        if (args.containsOption("validate") || args.containsOption("help")) {
            log.info("Skipping index ensure — no-database mode requested");
            return;
        }

        migrate();
        dropObsolete("BjjEvent", "ix_event_county_status_endDate");
        ensureIndexes();
        log.info("All Mongo indexes ensured");
    }

    private void ensureIndexes() {
        ensure(
                Gym.ENTITY_NAME,
                new Index()
                        .on("status", Sort.Direction.ASC)
                        .on("county", Sort.Direction.ASC)
                        .on("name", Sort.Direction.ASC)
                        .named("ix_gym_status_county_name"));

        ensure(
                Gym.ENTITY_NAME,
                new Index()
                        .on("status", Sort.Direction.ASC)
                        .on("name", Sort.Direction.ASC)
                        .named("ix_gym_status_name"));

        ensure(
                BjjEvent.ENTITY_NAME,
                new Index()
                        .on("isActive", Sort.Direction.ASC)
                        .on("schedule.endDate", Sort.Direction.ASC)
                        .named("ix_event_isActive_endDate"));

        ensure(
                BjjEvent.ENTITY_NAME,
                new Index()
                        .on("county", Sort.Direction.ASC)
                        .on("isActive", Sort.Direction.ASC)
                        .named("ix_event_county_isActive"));

        ensure(
                BjjEvent.ENTITY_NAME,
                new Index()
                        .on("isActive", Sort.Direction.ASC)
                        .on("status", Sort.Direction.ASC)
                        .on("createdAt", Sort.Direction.ASC)
                        .named("ix_event_isActive_status_createdAt"));

        ensure(
                BjjEvent.ENTITY_NAME,
                new Index()
                        .on("county", Sort.Direction.ASC)
                        .on("isActive", Sort.Direction.ASC)
                        .on("status", Sort.Direction.ASC)
                        .on("createdAt", Sort.Direction.ASC)
                        .named("ix_event_county_isActive_status_createdAt"));

        ensure(
                BjjEvent.ENTITY_NAME,
                new Index()
                        .on("expiresAt", Sort.Direction.ASC)
                        .named("ttl_event_expiresAt")
                        .expire(EXPIRE_AT_STORED_DATE));

        ensure(
                Competition.ENTITY_NAME,
                new Index()
                        .on("isActive", Sort.Direction.ASC)
                        .on("endDate", Sort.Direction.ASC)
                        .named("ix_competition_isActive_endDate"));

        ensure(
                Competition.ENTITY_NAME,
                new Index()
                        .on("isActive", Sort.Direction.ASC)
                        .on("startDate", Sort.Direction.ASC)
                        .on("name", Sort.Direction.ASC)
                        .named("ix_competition_isActive_startDate_name"));

        ensure(
                Competition.ENTITY_NAME,
                new Index()
                        .on("slug", Sort.Direction.ASC)
                        .named("ix_competition_slug_unique")
                        .unique());

        ensure(
                Competition.ENTITY_NAME,
                new Index()
                        .on("expiresAt", Sort.Direction.ASC)
                        .named("ttl_competition_expiresAt")
                        .expire(EXPIRE_AT_STORED_DATE));

        ensure(
                Store.ENTITY_NAME,
                new Index()
                        .on("isActive", Sort.Direction.ASC)
                        .on("name", Sort.Direction.ASC)
                        .named("ix_store_isActive_name"));
    }

    public void migrate() {
        long events = mongoTemplate
                .updateMulti(
                        Query.query(new Criteria()
                                .andOperator(
                                        Criteria.where("schedule").ne(null),
                                        Criteria.where("schedule.endDate").is(null))),
                        Update.update("schedule.endDate", OpenEndedInstant.VALUE),
                        BjjEvent.ENTITY_NAME)
                .getModifiedCount();
        long competitions = mongoTemplate
                .updateMulti(
                        Query.query(Criteria.where("endDate").is(null)),
                        Update.update("endDate", OpenEndedInstant.VALUE),
                        Competition.ENTITY_NAME)
                .getModifiedCount();
        long gyms = initializeVersion(Gym.ENTITY_NAME);
        long versionedEvents = initializeVersion(BjjEvent.ENTITY_NAME);
        log.info(
                "Stored-document migration updated {} open-ended events, {} open-ended competitions, {} gym versions, {} event versions",
                events,
                competitions,
                gyms,
                versionedEvents);
    }

    private long initializeVersion(String collection) {
        return mongoTemplate
                .updateMulti(
                        Query.query(Criteria.where("version").exists(false)), Update.update("version", 0L), collection)
                .getModifiedCount();
    }

    private void ensure(String collection, Index index) {
        String created = mongoTemplate.indexOps(collection).createIndex(index);
        log.info("Ensured index {} on collection {}", created, collection);
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
