package com.bjjeire.api.seeder;

import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.store.Store;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;

public record SeederCollection(
        String name, String slug, Class<?> type, Function<Object, String> idOf, Consumer<Object> stampExpiry) {
    public static final List<SeederCollection> ALL = List.of(
            new SeederCollection("Gym", "gyms", Gym.class, entity -> ((Gym) entity).getId(), entity -> {}),
            new SeederCollection(
                    "BjjEvent",
                    "bjj-events",
                    BjjEvent.class,
                    entity -> ((BjjEvent) entity).getId(),
                    entity -> ((BjjEvent) entity).stampExpiry()),
            new SeederCollection(
                    "Competition",
                    "competitions",
                    Competition.class,
                    entity -> ((Competition) entity).getId(),
                    entity -> ((Competition) entity).stampExpiry()),
            new SeederCollection("Store", "stores", Store.class, entity -> ((Store) entity).getId(), entity -> {}));
}
