package com.bjjeire.api.seeder;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Path;
import java.util.Collection;
import java.util.List;

/** Loads seeder JSON into Mongo. The CLI constructs {@link SeederServiceImpl}. */
public interface SeederService {
    /**
     * Outcome of seeding one file.
     *
     * @param exitCode process status
     * @param ids document ids read from the file
     */
    record SeedResult(int exitCode, List<String> ids) {}

    /**
     * Upserts one JSON file.
     *
     * @param collection target collection
     * @param jsonPath source file
     * @param mapper mapper used to read the file
     * @return the exit status and the ids in the file
     */
    SeedResult seed(SeederCollection collection, Path jsonPath, ObjectMapper mapper);

    /**
     * Deletes documents whose ids were not seeded.
     *
     * @param collection target collection
     * @param keepIds ids to retain
     * @return the exit status
     */
    int prune(SeederCollection collection, Collection<String> keepIds);
}
