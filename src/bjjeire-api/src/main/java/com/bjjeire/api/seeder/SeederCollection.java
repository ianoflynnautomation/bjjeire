package com.bjjeire.api.seeder;

import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.store.Store;
import com.bjjeire.api.tournament.Tournament;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * One seedable collection.
 *
 * @param testDatasetOnly true for a collection with no production seed. It is seeded, validated and pruned only when
 *     the test dataset is selected, so a production prune can never delete documents people created through the API
 */
public record SeederCollection(
        String name,
        String slug,
        Class<?> type,
        Function<Object, String> idOf,
        Consumer<Object> stampExpiry,
        boolean testDatasetOnly) {
    public static final List<SeederCollection> ALL = List.of(
            directory("Gym", "gyms", Gym.class, entity -> ((Gym) entity).getId(), entity -> {}),
            directory(
                    "BjjEvent",
                    "bjj-events",
                    BjjEvent.class,
                    entity -> ((BjjEvent) entity).getId(),
                    entity -> ((BjjEvent) entity).stampExpiry()),
            directory(
                    "Competition",
                    "competitions",
                    Competition.class,
                    entity -> ((Competition) entity).getId(),
                    entity -> ((Competition) entity).stampExpiry()),
            directory("Store", "stores", Store.class, entity -> ((Store) entity).getId(), entity -> {}),
            new SeederCollection(
                    Tournament.ENTITY_NAME,
                    "tournaments",
                    Tournament.class,
                    entity -> ((Tournament) entity).getId(),
                    entity -> {},
                    true));

    private static SeederCollection directory(
            String name, String slug, Class<?> type, Function<Object, String> idOf, Consumer<Object> stampExpiry) {
        return new SeederCollection(name, slug, type, idOf, stampExpiry, false);
    }
}
