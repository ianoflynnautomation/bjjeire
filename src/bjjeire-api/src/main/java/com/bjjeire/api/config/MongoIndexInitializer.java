package com.bjjeire.api.config;

import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.common.OpenEndedInstant;
import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.competitor.Competitor;
import com.bjjeire.api.competitor.DeletedCompetitor;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.order.MerchOrder;
import com.bjjeire.api.order.OrderStripeEvent;
import com.bjjeire.api.product.Product;
import com.bjjeire.api.registration.BjjEireCompetitionRegistration;
import com.bjjeire.api.registration.StripeEvent;
import com.bjjeire.api.store.Store;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.PartialIndexFilter;
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

    /**
     * Collections from before ADR-0015, dropped at startup (research R4). Remove one release after
     * specs/002-merge-tournaments-competitions, together with {@link #dropLegacyCollections()}.
     */
    static final List<String> LEGACY_COLLECTIONS = List.of("Tournament", "TournamentRegistration");

    private final MongoTemplate mongoTemplate;

    @Override
    public void run(ApplicationArguments args) {

        if (args.containsOption("validate") || args.containsOption("help")) {
            log.info("Skipping index ensure — no-database mode requested");
            return;
        }

        dropLegacyCollections();
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

        ensureBjjEireCompetitionIndexes();
        ensureProductIndexes();
        ensureOrderIndexes();
        ensureCompetitorIndexes();
        ensureRegistrationIndexes();
    }

    private void ensureRegistrationIndexes() {
        // FR-020: one active sign-up per competitor and division. Partial, so ended sign-ups do not count.
        ensure(
                BjjEireCompetitionRegistration.ENTITY_NAME,
                new Index()
                        .on("competitorId", Sort.Direction.ASC)
                        .on("competitionId", Sort.Direction.ASC)
                        .on("divisionId", Sort.Direction.ASC)
                        .named("ux_registration_active_competitor_division")
                        .unique()
                        .partial(PartialIndexFilter.of(Criteria.where("active").is(true))));

        // FR-041: at most two unpaid sign-ups per competitor and competition. Slot 0 or 1 while awaiting payment.
        ensure(
                BjjEireCompetitionRegistration.ENTITY_NAME,
                new Index()
                        .on("competitorId", Sort.Direction.ASC)
                        .on("competitionId", Sort.Direction.ASC)
                        .on("unpaidSlot", Sort.Direction.ASC)
                        .named("ux_registration_unpaid_slot")
                        .unique()
                        .partial(PartialIndexFilter.of(
                                Criteria.where("unpaidSlot").exists(true))));

        ensure(
                BjjEireCompetitionRegistration.ENTITY_NAME,
                new Index()
                        .on("competitionId", Sort.Direction.ASC)
                        .on("divisionId", Sort.Direction.ASC)
                        .on("status", Sort.Direction.ASC)
                        .named("ix_registration_competition_division_status"));

        ensure(
                BjjEireCompetitionRegistration.ENTITY_NAME,
                new Index()
                        .on("competitorId", Sort.Direction.ASC)
                        .on("createdAt", Sort.Direction.ASC)
                        .named("ix_registration_competitor"));

        ensure(
                BjjEireCompetitionRegistration.ENTITY_NAME,
                new Index()
                        .on("status", Sort.Direction.ASC)
                        .on("holdExpiresAt", Sort.Direction.ASC)
                        .named("ix_registration_status_holdExpiresAt"));

        ensure(
                BjjEireCompetitionRegistration.ENTITY_NAME,
                new Index()
                        .on("financialRecordsExpireAt", Sort.Direction.ASC)
                        .named("ix_registration_financialRecordsExpireAt")
                        .sparse());

        ensure(
                BjjEireCompetitionRegistration.ENTITY_NAME,
                new Index()
                        .on("payment.checkoutSessionId", Sort.Direction.ASC)
                        .named("ix_registration_checkoutSessionId"));

        ensure(
                StripeEvent.ENTITY_NAME,
                new Index()
                        .on("expiresAt", Sort.Direction.ASC)
                        .named("ttl_stripeEvent_expiresAt")
                        .expire(EXPIRE_AT_STORED_DATE));
    }

    private void ensureCompetitorIndexes() {
        ensure(
                Competitor.ENTITY_NAME,
                new Index()
                        .on("issuer", Sort.Direction.ASC)
                        .on("subject", Sort.Direction.ASC)
                        .named("ix_competitor_issuer_subject_unique")
                        .unique());

        ensure(
                DeletedCompetitor.ENTITY_NAME,
                new Index()
                        .on("issuer", Sort.Direction.ASC)
                        .on("subject", Sort.Direction.ASC)
                        .named("ix_deletedCompetitor_issuer_subject_unique")
                        .unique());
    }

    private void ensureProductIndexes() {
        ensure(
                Product.ENTITY_NAME,
                new Index()
                        .on("slug", Sort.Direction.ASC)
                        .named("ux_product_slug")
                        .unique());

        // The public catalogue: published products by kind, then name (#6001).
        ensure(
                Product.ENTITY_NAME,
                new Index()
                        .on("status", Sort.Direction.ASC)
                        .on("kind", Sort.Direction.ASC)
                        .on("name", Sort.Direction.ASC)
                        .named("ix_product_status_kind_name"));
    }

    private void ensureOrderIndexes() {
        ensure(
                MerchOrder.ENTITY_NAME,
                new Index()
                        .on("number", Sort.Direction.ASC)
                        .named("ux_order_number")
                        .unique());

        // The organiser's list, newest first, filtered by status (#6018).
        ensure(
                MerchOrder.ENTITY_NAME,
                new Index()
                        .on("status", Sort.Direction.ASC)
                        .on("createdAt", Sort.Direction.DESC)
                        .named("ix_order_status_created"));

        // Dashboard sales and refunds in a period (#6022).
        ensure(
                MerchOrder.ENTITY_NAME,
                new Index()
                        .on("payment.paidAt", Sort.Direction.ASC)
                        .named("ix_order_paidAt")
                        .sparse());
        ensure(
                MerchOrder.ENTITY_NAME,
                new Index()
                        .on("refundedAt", Sort.Direction.ASC)
                        .named("ix_order_refundedAt")
                        .sparse());

        // The hold sweep (FR-011).
        ensure(
                MerchOrder.ENTITY_NAME,
                new Index()
                        .on("status", Sort.Direction.ASC)
                        .on("holdExpiresAt", Sort.Direction.ASC)
                        .named("ix_order_hold"));

        // Research R7: at most three unpaid orders per email and per client address, exact under concurrency. Each
        // unpaid order holds a slot, 0 to 2; a slot is removed with any change of state. Partial, so ended orders do
        // not count.
        ensure(
                MerchOrder.ENTITY_NAME,
                new Index()
                        .on("email", Sort.Direction.ASC)
                        .on("emailSlot", Sort.Direction.ASC)
                        .named("ux_order_unpaid_email_slot")
                        .unique()
                        .partial(PartialIndexFilter.of(
                                Criteria.where("emailSlot").exists(true))));
        ensure(
                MerchOrder.ENTITY_NAME,
                new Index()
                        .on("clientIp", Sort.Direction.ASC)
                        .on("ipSlot", Sort.Direction.ASC)
                        .named("ux_order_unpaid_ip_slot")
                        .unique()
                        .partial(PartialIndexFilter.of(Criteria.where("ipSlot").exists(true))));

        // Research R11: paid orders go after six years, expired ones after 30 days. Unpaid orders have none.
        ensure(
                MerchOrder.ENTITY_NAME,
                new Index()
                        .on("retainUntil", Sort.Direction.ASC)
                        .named("ttl_order_retainUntil")
                        .expire(EXPIRE_AT_STORED_DATE));

        ensure(
                OrderStripeEvent.ENTITY_NAME,
                new Index()
                        .on("expiresAt", Sort.Direction.ASC)
                        .named("ttl_orderStripeEvent_expiresAt")
                        .expire(EXPIRE_AT_STORED_DATE));
    }

    private void ensureBjjEireCompetitionIndexes() {
        ensure(
                BjjEireCompetition.ENTITY_NAME,
                new Index()
                        .on("slug", Sort.Direction.ASC)
                        .named("ix_bjjeire_competition_slug_unique")
                        .unique());

        ensure(
                BjjEireCompetition.ENTITY_NAME,
                new Index()
                        .on("status", Sort.Direction.ASC)
                        .on("date", Sort.Direction.ASC)
                        .named("ix_bjjeire_competition_status_date"));
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
        long versionedBjjEireCompetitions = initializeVersion(BjjEireCompetition.ENTITY_NAME);
        log.info(
                "Stored-document migration updated {} open-ended events, {} open-ended competitions, {} gym versions, {} event"
                        + " versions, {} competition versions",
                events,
                competitions,
                gyms,
                versionedEvents,
                versionedBjjEireCompetitions);
    }

    // Remove one release after specs/002-merge-tournaments-competitions (ADR-0015, research R4).
    private void dropLegacyCollections() {
        for (String legacy : LEGACY_COLLECTIONS) {
            if (!mongoTemplate.collectionExists(legacy)) {
                log.info("Legacy collection {} not present", legacy);
                continue;
            }
            long documents = mongoTemplate.getCollection(legacy).countDocuments();
            mongoTemplate.dropCollection(legacy);
            log.info("Dropped legacy collection {} holding {} document(s)", legacy, documents);
        }
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
