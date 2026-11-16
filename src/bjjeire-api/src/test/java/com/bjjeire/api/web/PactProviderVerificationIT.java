package com.bjjeire.api.web;

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import au.com.dius.pact.provider.spring.junit5.PactVerificationSpringProvider;
import com.bjjeire.api.bjjeirecompetition.AgeCategory;
import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus;
import com.bjjeire.api.bjjeirecompetition.Discipline;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import com.bjjeire.api.common.County;
import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.competition.CompetitionRepository;
import com.bjjeire.api.competitor.Academy;
import com.bjjeire.api.competitor.Competitor;
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
import com.bjjeire.api.registration.BjjEireCompetitionRegistration;
import com.bjjeire.api.registration.Payment;
import com.bjjeire.api.registration.PaymentStatus;
import com.bjjeire.api.registration.RegistrationStatus;
import com.bjjeire.api.store.Store;
import com.bjjeire.api.store.StoreRepository;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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

    private static final String SIGN_UP_COMPETITION_ID = "0123456789abcdef0123aaaa";
    private static final String SIGN_UP_DIVISION_ID = "0123456789abcdef0123cccc";
    private static final String SIGN_UP_OTHER_DIVISION_ID = "0123456789abcdef0123eeee";
    private static final String SIGN_UP_REGISTRATION_ID = "0123456789abcdef0123bbbb";

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

    @State("a published competition exists")
    void aPublishedBjjEireCompetitionExists() {
        mongoTemplate.insert(BjjEireCompetition.builder()
                .slug("pact-competition")
                .name("Pact Competition")
                .date(LocalDate.parse("2026-06-27"))
                .venue(location())
                .entryFeeCents(2500)
                .registrationOpensAt(Instant.parse("2026-05-01T09:00:00Z"))
                .registrationClosesAt(Instant.parse("2026-06-20T20:00:00Z"))
                .status(BjjEireCompetitionStatus.PUBLISHED)
                .divisions(List.of(Division.builder()
                        .id("0123456789abcdef01234567")
                        .discipline(Discipline.GI)
                        .gender(Gender.MALE)
                        .ageCategory(AgeCategory.ADULT)
                        .belt(Belt.WHITE)
                        .weightClass("-76 kg")
                        .build()))
                .build());
    }

    @State("a competitor is signed in")
    void aCompetitorIsSignedIn() {
        // The stub decoder turns the interaction's bearer value into a competitor; no profile yet.
    }

    @State("a competitor with a profile is signed in")
    void aCompetitorWithAProfileIsSignedIn() {
        mongoTemplate.insert(Competitor.builder()
                .issuer(COMPETITOR_ISSUER)
                .subject(COMPETITOR_SUBJECT)
                .email("pact@example.test")
                .firstName("Aoife")
                .lastName("Byrne")
                .nationality("IE")
                .dateOfBirth(LocalDate.parse("1990-04-12"))
                .gender(Gender.FEMALE)
                .belt(Belt.BLUE)
                .academy(new Academy(null, "Team X"))
                .affiliation("Alliance")
                .build());
    }

    @State("a competitor with a profile and a competition open for sign-up")
    void aCompetitorWithAProfileAndABjjEireCompetitionOpenForSignUp() {
        aCompetitorWithAProfileIsSignedIn();
        insertSignUpBjjEireCompetition();
    }

    @State("a competitor with an unpaid sign-up")
    void aCompetitorWithAnUnpaidSignUp() {
        aCompetitorWithAProfileIsSignedIn();
        insertSignUpBjjEireCompetition();
        Competitor competitor =
                mongoTemplate.findOne(new org.springframework.data.mongodb.core.query.Query(), Competitor.class);
        insertRegistration(competitor.getId(), RegistrationStatus.AWAITING_PAYMENT);
    }

    @State("a competitor with a confirmed sign-up and another division open")
    void aCompetitorWithAConfirmedSignUpAndAnotherDivisionOpen() {
        aCompetitorWithAProfileIsSignedIn();
        insertSignUpBjjEireCompetition();
        mongoTemplate.updateFirst(
                org.springframework.data.mongodb.core.query.Query.query(
                        org.springframework.data.mongodb.core.query.Criteria.where("_id")
                                .is(SIGN_UP_COMPETITION_ID)),
                new org.springframework.data.mongodb.core.query.Update()
                        .push(
                                "divisions",
                                Division.builder()
                                        .id(SIGN_UP_OTHER_DIVISION_ID)
                                        .discipline(Discipline.GI)
                                        .gender(Gender.FEMALE)
                                        .ageCategory(AgeCategory.ADULT)
                                        .belt(Belt.BLUE)
                                        .weightClass("-70 kg")
                                        .build()),
                BjjEireCompetition.class);
        Competitor competitor =
                mongoTemplate.findOne(new org.springframework.data.mongodb.core.query.Query(), Competitor.class);
        insertRegistration(competitor.getId(), RegistrationStatus.CONFIRMED);
    }

    @State("a competition with a confirmed competitor")
    void aBjjEireCompetitionWithAConfirmedCompetitor() {
        insertSignUpBjjEireCompetition();
        insertRegistration("0123456789abcdef0123dddd", RegistrationStatus.CONFIRMED);
    }

    private void insertSignUpBjjEireCompetition() {
        mongoTemplate.insert(BjjEireCompetition.builder()
                .id(SIGN_UP_COMPETITION_ID)
                .slug("pact-sign-up")
                .name("Pact Sign-Up Competition")
                .date(LocalDate.parse("2026-06-27"))
                .venue(location())
                .entryFeeCents(2500)
                .registrationOpensAt(Instant.parse("2026-05-01T09:00:00Z"))
                .registrationClosesAt(Instant.parse("2026-06-20T20:00:00Z"))
                .status(BjjEireCompetitionStatus.PUBLISHED)
                .version(0L)
                .divisions(List.of(Division.builder()
                        .id(SIGN_UP_DIVISION_ID)
                        .discipline(Discipline.GI)
                        .gender(Gender.FEMALE)
                        .ageCategory(AgeCategory.ADULT)
                        .belt(Belt.BLUE)
                        .weightClass("-64 kg")
                        .build()))
                .build());
    }

    private void insertRegistration(String competitorId, RegistrationStatus status) {
        mongoTemplate.insert(BjjEireCompetitionRegistration.builder()
                .id(SIGN_UP_REGISTRATION_ID)
                .competitionId(SIGN_UP_COMPETITION_ID)
                .divisionId(SIGN_UP_DIVISION_ID)
                .competitorId(competitorId)
                .status(status)
                .active(Boolean.TRUE)
                .holdExpiresAt(status == RegistrationStatus.AWAITING_PAYMENT ? FIXED_NOW.plusSeconds(1800) : null)
                .displayName("Aoife Byrne")
                .academy(new Academy(null, "Team X"))
                .affiliation("Alliance")
                .payment(Payment.builder()
                        .checkoutSessionId("cs_test_pact")
                        .checkoutUrl("https://checkout.stripe.com/c/pay/cs_test_pact")
                        .amountCents(2500)
                        .currency("EUR")
                        .status(status == RegistrationStatus.CONFIRMED ? PaymentStatus.PAID : PaymentStatus.PENDING)
                        .paymentIntentId(status == RegistrationStatus.CONFIRMED ? "pi_test_pact" : null)
                        .build())
                .createdOnUtc(FIXED_NOW)
                .build());
    }

    @State("feature flags are configured")
    void featureFlagsAreConfigured() {
        // Flags come from configuration, not Mongo DB.
    }

    private static Location location() {
        return new Location(
                "1 Main Street",
                "Dublin Gym",
                new GeoCoordinates("Point", List.of(-6.2603, 53.3498), "Dublin", "test"));
    }
}
