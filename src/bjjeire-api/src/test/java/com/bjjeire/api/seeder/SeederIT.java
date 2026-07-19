package com.bjjeire.api.seeder;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.config.SeederProperties;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.gym.Gym;
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
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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
                assertThat(event.getExpiresAt())
                        .isEqualTo(event.getSchedule().endDate().plus(BjjEvent.EXPIRY_GRACE));
            }
        });
        assertThat(mongoTemplate.findAll(Competition.class))
                .filteredOn(competition -> competition.getEndDate() != null)
                .allSatisfy(competition -> assertThat(competition.getExpiresAt())
                        .isEqualTo(competition.getEndDate().plus(Competition.EXPIRY_GRACE)));
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
