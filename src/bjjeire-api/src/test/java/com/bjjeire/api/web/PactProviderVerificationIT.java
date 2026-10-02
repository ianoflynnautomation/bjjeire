package com.bjjeire.api.web;

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import au.com.dius.pact.provider.spring.junit5.PactVerificationSpringProvider;
import com.bjjeire.api.common.County;
import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.competition.CompetitionRepository;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.event.BjjEventRepository;
import com.bjjeire.api.event.BjjEventSchedule;
import com.bjjeire.api.event.BjjEventSession;
import com.bjjeire.api.event.BjjEventType;
import com.bjjeire.api.event.EventStatus;
import com.bjjeire.api.event.Organizer;
import com.bjjeire.api.event.PricingModel;
import com.bjjeire.api.event.PricingType;
import com.bjjeire.api.event.ScheduleKind;
import com.bjjeire.api.gym.ClassCategory;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.gym.GymRepository;
import com.bjjeire.api.gym.GymStatus;
import com.bjjeire.api.gym.TrialOffer;
import com.bjjeire.api.store.Store;
import com.bjjeire.api.store.StoreRepository;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

/**
 * Replays the SPA's Pact file against this API. Excluded from the default Failsafe run. CI runs it with
 * {@code -Ppact-provider} after the consumer job has written {@code pacts/BjjEireWeb-BjjEireApi.json} into this module.
 */
@Provider("BjjEireApi")
@PactFolder("pacts")
class PactProviderVerificationIT extends MongoIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private BjjEventRepository bjjEventRepository;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private StoreRepository storeRepository;

    @BeforeEach
    void targetRunningApi(PactVerificationContext context) {
        if (context != null) {
            context.setTarget(new HttpTestTarget("localhost", port));
        }
    }

    @TestTemplate
    @ExtendWith(PactVerificationSpringProvider.class)
    void verifyConsumerInteraction(PactVerificationContext context) {
        context.verifyInteraction();
    }

    @State("gyms exist")
    void gymsExist() {
        gymRepository.save(Gym.builder()
                .name("Pact Gym")
                .status(GymStatus.Active)
                .county(County.Dublin)
                .trialOffer(new TrialOffer(false, null, null, null))
                .location(location())
                .socialMedia(new SocialMedia(null, null, null, null))
                .offeredClasses(List.of(ClassCategory.BJJGiAllLevels))
                .build());
    }

    @State("bjj events exist")
    void bjjEventsExist() {
        Instant start = Instant.parse("2026-08-01T10:00:00Z");
        bjjEventRepository.save(BjjEvent.builder()
                .name("Pact Open Mat")
                .description("Open training session")
                .types(List.of(BjjEventType.OpenMat))
                .organiser(new Organizer("BJJ Eire", "https://bjjeire.com"))
                .status(EventStatus.Upcoming)
                .county(County.Dublin)
                .location(location())
                .socialMedia(new SocialMedia(null, null, null, null))
                .schedule(new BjjEventSchedule(
                        ScheduleKind.FixedDates,
                        start,
                        Instant.parse("2026-08-01T12:00:00Z"),
                        List.of(new BjjEventSession(
                                start, null, LocalTime.of(10, 0), LocalTime.of(12, 0), "Session 1", null))))
                .pricingOptions(List.of(new PricingModel(PricingType.Free, null, null, BigDecimal.ZERO, null, null)))
                .active(true)
                .build());
    }

    @State("competitions exist")
    void competitionsExist() {
        competitionRepository.save(Competition.builder()
                .slug("pact-open")
                .name("Pact Open")
                .websiteUrl("https://example.com/pact-open")
                .startDate(Instant.parse("2026-08-01T09:00:00Z"))
                .endDate(Instant.parse("2026-08-02T18:00:00Z"))
                .isActive(true)
                .build());
    }

    @State("stores exist")
    void storesExist() {
        storeRepository.save(Store.builder()
                .name("Pact Store")
                .websiteUrl("https://example.com/store")
                .isActive(true)
                .build());
    }

    @State("feature flags are configured")
    void featureFlagsAreConfigured() {
        // Flags come from configuration, not Mongo.
    }

    private static Location location() {
        return new Location(
                "1 Main Street",
                "Dublin Gym",
                new GeoCoordinates("Point", List.of(-6.2603, 53.3498), "Dublin", "test"));
    }
}
