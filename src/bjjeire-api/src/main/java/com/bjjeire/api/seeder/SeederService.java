package com.bjjeire.api.seeder;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.bulk.BulkWriteResult;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.util.Pair;

public class SeederService {
    public record SeedResult(int exitCode, List<String> ids) {}

    private final MongoTemplate mongoTemplate;
    private final boolean dryRun;

    public SeederService(MongoTemplate mongoTemplate, boolean dryRun) {
        this.mongoTemplate = mongoTemplate;
        this.dryRun = dryRun;
    }

    public SeedResult seed(SeederCollection collection, Path jsonPath, ObjectMapper mapper) {
        System.out.printf("%n── %s (%s) ──%n", collection.name(), jsonPath);

        List<Object> entities;
        try {
            entities = mapper.readValue(
                    jsonPath.toFile(), mapper.getTypeFactory().constructCollectionType(List.class, collection.type()));
        } catch (IOException exception) {
            System.err.println("  ERROR: " + exception.getMessage());
            return new SeedResult(ExitCodes.FAILURE, List.of());
        }

        if (entities == null || entities.isEmpty()) {
            System.out.println("  No documents found — skipping.");
            return new SeedResult(ExitCodes.SUCCESS, List.of());
        }

        List<String> ids = entities.stream().map(collection.idOf()).toList();

        if (dryRun) {
            return dryRunReport(collection, ids);
        }

        return bulkUpsert(collection, entities, ids);
    }

    public int prune(SeederCollection collection, Collection<String> keepIds) {
        if (keepIds.isEmpty()) {
            System.out.printf("  Skipping prune for %s: no seeded ids (empty source).%n", collection.name());
            return ExitCodes.SUCCESS;
        }

        Query staleQuery = new Query(Criteria.where("_id").nin(keepIds));

        if (dryRun) {
            long stale = mongoTemplate.count(staleQuery, collection.type());
            System.out.printf("  [DRY RUN] Would prune %d stale document(s) from %s.%n", stale, collection.name());
            return ExitCodes.SUCCESS;
        }

        long deleted = mongoTemplate.remove(staleQuery, collection.type()).getDeletedCount();
        System.out.printf("  Pruned %d stale document(s) from %s.%n", deleted, collection.name());
        return ExitCodes.SUCCESS;
    }

    private SeedResult dryRunReport(SeederCollection collection, List<String> ids) {
        Query existsQuery = new Query(Criteria.where("_id").in(ids));
        existsQuery.fields().include("_id");
        Set<String> existing = new HashSet<>(mongoTemplate.find(existsQuery, collection.type()).stream()
                .map(collection.idOf())
                .toList());
        long replace = ids.stream().filter(existing::contains).count();
        System.out.printf("  [DRY RUN] Would insert %d, replace %d.%n", ids.size() - replace, replace);
        return new SeedResult(ExitCodes.SUCCESS, ids);
    }

    private SeedResult bulkUpsert(SeederCollection collection, List<Object> entities, List<String> ids) {
        // Seeder writes bypass the service layer, so the TTL stamp is applied here,
        // matching the expiry-stamping behaviour of the API's write path.
        for (Object entity : entities) {
            collection.stampExpiry().accept(entity);
        }

        BulkOperations bulk = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, collection.type());
        for (Pair<String, Object> entry : zip(ids, entities)) {
            bulk.replaceOne(
                    new Query(Criteria.where("_id").is(entry.getFirst())),
                    entry.getSecond(),
                    org.springframework.data.mongodb.core.FindAndReplaceOptions.options()
                            .upsert());
        }

        try {
            BulkWriteResult result = bulk.execute();
            System.out.printf(
                    "  Result: %d inserted, %d replaced.%n", result.getUpserts().size(), result.getModifiedCount());
            return new SeedResult(ExitCodes.SUCCESS, ids);
        } catch (RuntimeException exception) {
            System.err.println("  FAILED: " + exception.getMessage());
            return new SeedResult(ExitCodes.FAILURE, ids);
        }
    }

    private static List<Pair<String, Object>> zip(List<String> ids, List<Object> entities) {
        return java.util.stream.IntStream.range(0, ids.size())
                .mapToObj(i -> Pair.of(ids.get(i), entities.get(i)))
                .toList();
    }
}
