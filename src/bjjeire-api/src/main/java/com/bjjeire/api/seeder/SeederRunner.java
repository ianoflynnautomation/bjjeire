package com.bjjeire.api.seeder;

import com.bjjeire.api.config.SeederProperties;
import com.bjjeire.api.product.Product;
import com.bjjeire.api.product.ProductPhotoStore;
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

@Component
@Profile("seeder")
@Order(2)
@RequiredArgsConstructor
public class SeederRunner implements CommandLineRunner, ExitCodeGenerator {
    private static final String PRODUCTION_DATA_DIR = "data";
    private static final String TEST_DATA_DIR = "data-test";
    /** Product photos for the test dataset, loaded into GridFS under their SHA-256 like an organiser's upload. */
    private static final String PRODUCT_PHOTOS_DIR = "product-photos";

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
        SeederService seeder = new SeederServiceImpl(mongoTemplate, options.dryRun());
        int result = ExitCodes.SUCCESS;

        for (SeederCollection collection : toRun) {
            List<String> seededIds = new ArrayList<>();
            for (Path file : resolveDataSources(collection.slug())) {
                ObjectMapper mapper = SeederJson.mapper(false, isTestDataFile(file), clock);
                SeederService.SeedResult seedResult = seeder.seed(collection, file, mapper);
                result |= seedResult.exitCode();
                seededIds.addAll(seedResult.ids());
            }

            if (Product.ENTITY_NAME.equals(collection.name())) {
                result |= seedProductPhotos(options.dryRun());
            }

            if (options.prune() && collection.prunable()) {
                result |= seeder.prune(collection, seededIds);
            } else if (options.prune()) {
                System.out.printf("  Not pruning %s: the API writes it too.%n", collection.name());
            }
        }

        return result;
    }

    /** Stores each test photo once; a photo already stored is left as it is. */
    private int seedProductPhotos(boolean dryRun) {
        Path dir = Path.of(properties.dataRoot(), TEST_DATA_DIR, PRODUCT_PHOTOS_DIR);
        if (!properties.useTestDataset() || !Files.isDirectory(dir)) {
            return ExitCodes.SUCCESS;
        }
        System.out.printf("%n── product photos (%s) ──%n", dir);
        ProductPhotoStore store = new ProductPhotoStore(mongoTemplate);
        int stored = 0;
        try (Stream<Path> entries = Files.list(dir)) {
            for (Path file : entries.sorted().toList()) {
                byte[] content = Files.readAllBytes(file);
                String contentType = ProductPhotoStore.detectType(content).orElse(null);
                if (contentType == null) {
                    System.err.printf("  ERROR %s: not a JPEG, PNG or WebP image.%n", file);
                    return ExitCodes.FAILURE;
                }
                if (!dryRun && store.store(ProductPhotoStore.sha256(content), content, contentType, "seeder")) {
                    stored++;
                }
            }
        } catch (IOException exception) {
            System.err.println("  ERROR: " + exception.getMessage());
            return ExitCodes.FAILURE;
        }
        System.out.printf("  %s %d photo(s).%n", dryRun ? "[DRY RUN] Would check" : "Stored", stored);
        return ExitCodes.SUCCESS;
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
        // A collection with no production seed does not exist for a production run, prune included.
        List<SeederCollection> available = SeederCollection.ALL.stream()
                .filter(collection -> !collection.testDatasetOnly() || properties.useTestDataset())
                .toList();
        if (filter == null) {
            return available;
        }

        List<SeederCollection> matched = available.stream()
                .filter(collection -> collection.name().equals(filter))
                .toList();
        if (matched.isEmpty()) {
            System.err.printf(
                    "ERROR: Unknown collection '%s'. Valid values: %s%n",
                    filter,
                    String.join(
                            ", ", available.stream().map(SeederCollection::name).toList()));
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
