package com.bjjeire.api.seeder;

import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.competitor.Competitor;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.registration.BjjEireCompetitionRegistration;
import com.bjjeire.api.store.Store;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * One seedable collection.
 *
 * @param testDatasetOnly true for a collection with no production seed. It is seeded, validated and pruned only when
 *     the test dataset is selected, so a production prune can never delete documents people created through the API
 * @param prunable false for a collection that acceptance runs also write through the API (sign-ups, competitor
 *     profiles): {@code --prune} leaves it alone, so seeding only adds or replaces its seeded documents
 */
public record SeederCollection(
        String name,
        String slug,
        Class<?> type,
        Function<Object, String> idOf,
        Consumer<Object> stampExpiry,
        boolean testDatasetOnly,
        boolean prunable) {
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
                    BjjEireCompetition.ENTITY_NAME,
                    "bjjeire-competitions",
                    BjjEireCompetition.class,
                    entity -> ((BjjEireCompetition) entity).getId(),
                    entity -> {},
                    true,
                    true),
            // A finished competition's medallists and one profile that owns medals (test dataset only, never pruned).
            new SeederCollection(
                    Competitor.ENTITY_NAME,
                    "competitors",
                    Competitor.class,
                    entity -> ((Competitor) entity).getId(),
                    entity -> {},
                    true,
                    false),
            new SeederCollection(
                    BjjEireCompetitionRegistration.ENTITY_NAME,
                    "bjjeire-competition-registrations",
                    BjjEireCompetitionRegistration.class,
                    entity -> ((BjjEireCompetitionRegistration) entity).getId(),
                    entity -> {},
                    true,
                    false));

    private static SeederCollection directory(
            String name, String slug, Class<?> type, Function<Object, String> idOf, Consumer<Object> stampExpiry) {
        return new SeederCollection(name, slug, type, idOf, stampExpiry, false, true);
    }
}
