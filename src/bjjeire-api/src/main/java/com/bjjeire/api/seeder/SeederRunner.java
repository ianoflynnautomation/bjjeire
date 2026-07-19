package com.bjjeire.api.seeder;

import com.bjjeire.api.config.SeederProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.ExitCodeGenerator;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/**
 * Entry point for the seeder profile; the Mongo index initializer runs first (order 1) so seeding always happens
 * against ensured indexes, mirroring the established order: indexes first, then collections.
 */
@Component
@Profile("seeder")
@Order(2)
@RequiredArgsConstructor
public class SeederRunner implements CommandLineRunner, ExitCodeGenerator {
    private static final String PRODUCTION_DATA_DIR = "data";
    private static final String TEST_DATA_DIR = "data-test";

    private final MongoTemplate mongoTemplate;
    private final SeederProperties properties;
    private final Clock clock;

    private int exitCode = ExitCodes.SUCCESS;

    @Override
    public void run(String... args) {
        SeederArgs.ParseResult parsed = SeederArgs.parse(args);
        if (parsed.error() != null) {
            System.err.println("ERROR: " + parsed.error());
            System.out.println();
            System.out.println(SeederArgs.USAGE);
            exitCode = ExitCodes.FAILURE;
            return;
        }

        SeederArgs options = parsed.args();
        if (options.help()) {
            System.out.println(SeederArgs.USAGE);
            return;
        }

        List<SeederCollection> toRun = resolveCollections(options.collection());
        if (toRun == null) {
            exitCode = ExitCodes.FAILURE;
            return;
        }

        if (options.validate()) {
            System.out.println("Validating data files against Domain entities (strict)...");
            exitCode = validate(toRun);
            return;
        }

        if (!EnvironmentGuard.isAllowed(options.force())) {
            exitCode = ExitCodes.FAILURE;
            return;
        }
        if (options.dryRun()) {
            System.out.println("[DRY RUN] No changes will be written to the database.");
        }
        if (options.prune()) {
            System.out.println("[PRUNE] Documents not present in JSON sources will be deleted.");
        }

        exitCode = seed(toRun, options);
        System.out.println(
                exitCode == ExitCodes.SUCCESS
                        ? "\nSeeding completed successfully."
                        : "\nSeeding completed with errors.");
    }

    @Override
    public int getExitCode() {
        return exitCode;
    }

    private int seed(List<SeederCollection> toRun, SeederArgs options) {
        SeederService seeder = new SeederService(mongoTemplate, options.dryRun());
        int result = ExitCodes.SUCCESS;

        for (SeederCollection collection : toRun) {
            List<String> seededIds = new ArrayList<>();
            for (Path file : resolveDataSources(collection.slug())) {
                ObjectMapper mapper = SeederJson.mapper(false, isTestDataFile(file), clock);
                SeederService.SeedResult seedResult = seeder.seed(collection, file, mapper);
                result |= seedResult.exitCode();
                seededIds.addAll(seedResult.ids());
            }

            if (options.prune()) {
                result |= seeder.prune(collection, seededIds);
            }
        }

        return result;
    }

    private int validate(List<SeederCollection> toRun) {
        int result = ExitCodes.SUCCESS;
        for (SeederCollection collection : toRun) {
            for (Path file : resolveDataSources(collection.slug())) {
                ObjectMapper mapper = SeederJson.mapper(true, isTestDataFile(file), clock);
                try {
                    mapper.readValue(
                            file.toFile(),
                            mapper.getTypeFactory().constructCollectionType(List.class, collection.type()));
                    System.out.printf("  OK    %s%n", file);
                } catch (IOException exception) {
                    System.err.printf("  ERROR %s: %s%n", file, exception.getMessage());
                    result = ExitCodes.FAILURE;
                }
            }
        }
        return result;
    }

    private List<SeederCollection> resolveCollections(String filter) {
        if (filter == null) {
            return SeederCollection.ALL;
        }

        List<SeederCollection> matched = SeederCollection.ALL.stream()
                .filter(collection -> collection.name().equals(filter))
                .toList();
        if (matched.isEmpty()) {
            System.err.printf(
                    "ERROR: Unknown collection '%s'. Valid values: %s%n",
                    filter,
                    String.join(
                            ", ",
                            SeederCollection.ALL.stream()
                                    .map(SeederCollection::name)
                                    .toList()));
            return null;
        }
        return matched;
    }

    List<Path> resolveDataSources(String slug) {
        List<Path> roots = new ArrayList<>();
        roots.add(Path.of(properties.dataRoot(), PRODUCTION_DATA_DIR, slug));
        if (properties.useTestDataset()) {
            roots.add(Path.of(properties.dataRoot(), TEST_DATA_DIR, slug));
        }

        List<Path> files = new ArrayList<>();
        for (Path dir : roots) {
            if (!Files.isDirectory(dir)) {
                continue;
            }
            try (Stream<Path> entries = Files.list(dir)) {
                entries.filter(file -> file.getFileName().toString().endsWith(".json"))
                        .filter(file -> !file.getFileName().toString().startsWith("_"))
                        .sorted()
                        .forEach(files::add);
            } catch (IOException exception) {
                System.err.println("  ERROR: " + exception.getMessage());
            }
        }
        return files;
    }

    private static boolean isTestDataFile(Path file) {
        return file.toString().replace('\\', '/').contains("/" + TEST_DATA_DIR + "/");
    }
}
