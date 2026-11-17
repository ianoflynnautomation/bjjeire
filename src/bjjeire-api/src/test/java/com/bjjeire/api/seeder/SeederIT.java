package com.bjjeire.api.seeder;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus;
import com.bjjeire.api.common.OpenEndedInstant;
import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.competitor.Competitor;
import com.bjjeire.api.config.LocalSignInTokens;
import com.bjjeire.api.config.SeederProperties;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.registration.BjjEireCompetitionRegistration;
import com.bjjeire.api.registration.RegistrationStatus;
import com.bjjeire.api.store.Store;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

class SeederIT extends MongoIntegrationTest {
    // The canonical JSON sources at the repo root.
    private static final Path DATA_ROOT = Path.of("../../seeder");

    @Autowired
    private Clock clock;

    private SeederRunner runner;

    @BeforeEach
    void createRunner() {
        runner = new SeederRunner(mongoTemplate, new SeederProperties(DATA_ROOT.toString(), ""), clock);
    }

    private SeederRunner testDatasetRunner() {
        return new SeederRunner(mongoTemplate, new SeederProperties(DATA_ROOT.toString(), "test"), clock);
    }

    @Test
    void shouldValidateProductionDataFilesStrictlyAgainstTheJavaDomain() {
        runner.run("--validate");

        assertThat(runner.getExitCode()).isZero();
    }

    @Test
    void shouldUpsertAllCollectionsAndStampExpiryWhenSeeding() {
        runner.run("--force");

        assertThat(runner.getExitCode()).isZero();
        assertThat(mongoTemplate.count(new Query(), Gym.class)).isPositive();
        assertThat(mongoTemplate.count(new Query(), BjjEvent.class)).isPositive();
        assertThat(mongoTemplate.count(new Query(), Competition.class)).isPositive();
        assertThat(mongoTemplate.count(new Query(), Store.class)).isPositive();

        List<BjjEvent> events = mongoTemplate.findAll(BjjEvent.class);
        assertThat(events).allSatisfy(event -> {
            assertThat(event.getTypes()).isNotEmpty();
            assertThat(event.getPricingOptions()).isNotEmpty();
            if (event.getSchedule() != null && event.getSchedule().endDate() != null) {
                if (OpenEndedInstant.isOpen(event.getSchedule().endDate())) {
                    assertThat(event.getExpiresAt()).isNull();
                } else {
                    assertThat(event.getExpiresAt())
                            .isEqualTo(event.getSchedule().endDate().plus(BjjEvent.EXPIRY_GRACE));
                }
            }
        });
        assertThat(mongoTemplate.findAll(Competition.class)).allSatisfy(competition -> {
            if (OpenEndedInstant.isOpen(competition.getEndDate())) {
                assertThat(competition.getExpiresAt()).isNull();
            } else {
                assertThat(competition.getExpiresAt())
                        .isEqualTo(competition.getEndDate().plus(Competition.EXPIRY_GRACE));
            }
        });
    }

    @Test
    void shouldBeIdempotentWhenSeedingTwice() {
        runner.run("--force");
        long firstCount = mongoTemplate.count(new Query(), Competition.class);

        runner.run("--force");

        assertThat(runner.getExitCode()).isZero();
        assertThat(mongoTemplate.count(new Query(), Competition.class)).isEqualTo(firstCount);
    }

    @Test
    void shouldRemoveDocumentsAbsentFromSourcesWhenPruning() {
        Gym stale = new Gym();
        stale.setId("202607180000000000000001");
        stale.setName("Stale Gym");
        mongoTemplate.save(stale);

        runner.run("--force", "--prune", "--collection", "Gym");

        assertThat(runner.getExitCode()).isZero();
        assertThat(mongoTemplate.findById("202607180000000000000001", Gym.class))
                .isNull();
        assertThat(mongoTemplate.count(new Query(), Gym.class)).isPositive();
    }

    @Test
    @Tag("#3017")
    void shouldSeedBjjEireCompetitionsOnlyFromTheTestDataset() {
        runner.run("--force");
        assertThat(mongoTemplate.count(new Query(), BjjEireCompetition.class)).isZero();

        SeederRunner testRunner = testDatasetRunner();
        testRunner.run("--force");

        assertThat(testRunner.getExitCode()).isZero();
        List<BjjEireCompetition> seeded = mongoTemplate.findAll(BjjEireCompetition.class);
        assertThat(seeded)
                .extracting(BjjEireCompetition::getSlug)
                .containsExactlyInAnyOrder(
                        "acceptance-open", "acceptance-opens-later", "acceptance-closed", "acceptance-finished");
        assertThat(seeded).isNotEmpty().allSatisfy(competition -> {
            assertThat(competition.getStatus())
                    .isIn(BjjEireCompetitionStatus.PUBLISHED, BjjEireCompetitionStatus.FINISHED);
            assertThat(competition.getDivisions()).isNotEmpty();
            assertThat(competition.getCurrency()).isEqualTo(BjjEireCompetition.CURRENCY);
            assertThat(competition.getRegistrationClosesAt()).isAfter(competition.getRegistrationOpensAt());
        });
    }

    /**
     * The finished competition shows a past event's leaderboard: every medallist is a seeded confirmed sign-up in that
     * division, each result stores the division's confirmed count, and a seeded profile owns two of the medals so a
     * local sign-in as that email shows a medal history.
     */
    @Test
    void shouldSeedAFinishedCompetitionWithMedallistsAndAProfileFromTheTestDataset() {
        SeederRunner testRunner = testDatasetRunner();
        testRunner.run("--force");

        assertThat(testRunner.getExitCode()).isZero();
        BjjEireCompetition finished = mongoTemplate.findOne(
                Query.query(Criteria.where("slug").is("acceptance-finished")), BjjEireCompetition.class);
        assertThat(finished.getStatus()).isEqualTo(BjjEireCompetitionStatus.FINISHED);
        List<BjjEireCompetitionRegistration> signUps = mongoTemplate.find(
                Query.query(Criteria.where("competitionId").is(finished.getId())),
                BjjEireCompetitionRegistration.class);
        assertThat(finished.getDivisions()).allSatisfy(division -> {
            assertThat(division.getResult()).isNotNull();
            List<String> confirmedHere = signUps.stream()
                    .filter(signUp -> signUp.getDivisionId().equals(division.getId()))
                    .filter(signUp -> signUp.getStatus() == RegistrationStatus.CONFIRMED)
                    .map(BjjEireCompetitionRegistration::getId)
                    .toList();
            assertThat(confirmedHere).containsAll(division.getResult().medallistIds());
            assertThat(division.getResult().getConfirmedCompetitors()).isEqualTo(confirmedHere.size());
        });

        Competitor medallist = mongoTemplate.findById(SEEDED_COMPETITOR_ID, Competitor.class);
        assertThat(medallist.getIssuer()).isEqualTo(LocalSignInTokens.COMPETITOR_ISSUER);
        assertThat(medallist.getSubject())
                .isEqualTo(LocalSignInTokens.COMPETITOR_SUBJECT_PREFIX + sha256("medallist@acceptance.bjjeire.test"));
        assertThat(signUps)
                .filteredOn(signUp -> SEEDED_COMPETITOR_ID.equals(signUp.getCompetitorId()))
                .hasSize(2);
        // A snapshot-only sign-up has no account behind it, so it holds no place: active is unset, as after deletion.
        assertThat(signUps)
                .filteredOn(signUp -> signUp.getCompetitorId() == null)
                .allSatisfy(signUp -> assertThat(signUp.getActive()).isNull());
    }

    /** The seeded finished competition's public leaderboard, worked out by hand from the seed files. */
    @Test
    void shouldServeTheSeededFinishedCompetitionsLeaderboardAndWinners() {
        testDatasetRunner().run("--force");

        String json = restTemplate
                .getForEntity(
                        com.bjjeire.api.common.ApiRoutes.BJJEIRE_COMPETITION + "/acce88000000000000000004/leaderboard",
                        String.class)
                .getBody();

        // Academies: Lee Valley 9+1+3+9 = 22, Liffey 3+9+3 = 15, Corrib 3+9 = 12, Shannon 1+1 = 2 (its
        // single-competitor gold adds nothing). Affiliations: Atlantic Alliance 15+12 = 27, Celtic Collective 22.
        assertThat(json)
                .contains(
                        "\"winners\":{\"academies\":[\"Lee Valley Jiu-Jitsu\"],\"affiliations\":[\"Atlantic Alliance\"]}")
                .contains("\"name\":\"Lee Valley Jiu-Jitsu\",\"points\":22")
                .contains("\"name\":\"Liffey BJJ\",\"points\":15")
                .contains("\"name\":\"Corrib Grappling\",\"points\":12")
                .contains("\"name\":\"Shannon Combat Club\",\"points\":2")
                .contains("\"name\":\"Atlantic Alliance\",\"points\":27")
                .contains("\"name\":\"Celtic Collective\",\"points\":22")
                .contains("\"pointsAwarded\":false");
    }

    /**
     * Sign-ups and profiles also come from acceptance runs through the API; a test-dataset prune never deletes them.
     */
    @Test
    void shouldKeepSignUpsAndProfilesCreatedThroughTheApiWhenPruningTheTestDataset() {
        mongoTemplate.save(BjjEireCompetitionRegistration.builder()
                .id("202611160000000000000001")
                .competitionId("acce88000000000000000001")
                .divisionId("acce99000000000000000101")
                .status(RegistrationStatus.AWAITING_PAYMENT)
                .build());
        mongoTemplate.save(Competitor.builder()
                .id("202611160000000000000002")
                .issuer(LocalSignInTokens.COMPETITOR_ISSUER)
                .subject("local-competitor:created-by-a-test")
                .build());

        SeederRunner testRunner = testDatasetRunner();
        testRunner.run("--force", "--prune");

        assertThat(testRunner.getExitCode()).isZero();
        assertThat(mongoTemplate.findById("202611160000000000000001", BjjEireCompetitionRegistration.class))
                .isNotNull();
        assertThat(mongoTemplate.findById("202611160000000000000002", Competitor.class))
                .isNotNull();
    }

    @Test
    void shouldValidateTestRegistrationAndCompetitorFilesStrictlyAgainstTheJavaDomain() {
        SeederRunner testRunner = testDatasetRunner();

        testRunner.run("--validate");

        assertThat(testRunner.getExitCode()).isZero();
    }

    private static final String SEEDED_COMPETITOR_ID = "acce66000000000000000001";

    private static String sha256(String text) {
        try {
            return java.util.HexFormat.of()
                    .formatHex(java.security.MessageDigest.getInstance("SHA-256")
                            .digest(text.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    @Test
    void shouldValidateTestBjjEireCompetitionFilesStrictlyAgainstTheJavaDomain() {
        SeederRunner testRunner = testDatasetRunner();

        testRunner.run("--validate", "--collection", "BjjEireCompetition");

        assertThat(testRunner.getExitCode()).isZero();
    }

    /** Production has no competition seed: a prune there must not delete the organiser's competitions. */
    @Test
    void shouldLeaveBjjEireCompetitionsAloneWhenPruningOutsideTheTestDataset() {
        BjjEireCompetition real = BjjEireCompetition.builder()
                .id("202611130000000000000001")
                .slug("bjjeire")
                .name("BjjEire")
                .build();
        mongoTemplate.save(real);

        runner.run("--force", "--prune");

        assertThat(runner.getExitCode()).isZero();
        assertThat(mongoTemplate.findById("202611130000000000000001", BjjEireCompetition.class))
                .isNotNull();
    }

    @Test
    void shouldWriteNothingWhenDryRunning() {
        runner.run("--force", "--dry-run");

        assertThat(runner.getExitCode()).isZero();
        assertThat(mongoTemplate.count(new Query(), Gym.class)).isZero();
        assertThat(mongoTemplate.count(new Query(), BjjEvent.class)).isZero();
    }

    @Test
    void shouldFailWhenCollectionIsUnknown() {
        runner.run("--force", "--collection", "Nope");

        assertThat(runner.getExitCode()).isEqualTo(1);
    }

    @Test
    void shouldResolveRelativeDatesInTestDataset() throws Exception {
        List<Path> testEventFiles = new ArrayList<>();
        Path testDir = DATA_ROOT.resolve("data-test/bjj-events");
        if (Files.isDirectory(testDir)) {
            try (var stream = Files.list(testDir)) {
                stream.filter(f -> f.toString().endsWith(".json"))
                        .filter(f -> !f.getFileName().toString().startsWith("_"))
                        .forEach(testEventFiles::add);
            }
        }
        Assumptions.assumeFalse(testEventFiles.isEmpty());

        ObjectMapper mapper = SeederJson.mapper(false, true, clock);
        for (Path file : testEventFiles) {
            List<BjjEvent> events = mapper.readValue(
                    file.toFile(), mapper.getTypeFactory().constructCollectionType(List.class, BjjEvent.class));
            assertThat(events).isNotEmpty();
        }
    }
}
