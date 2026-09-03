package com.bjjeire.api.seeder;

import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.store.Store;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Clock;
import java.time.Instant;
import java.util.List;

public final class SeederJson {
    private SeederJson() {}

    public static ObjectMapper mapper(boolean strict, boolean relativeDates, Clock clock) {
        JsonMapper.Builder builder = JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, strict)
                .configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, !strict);

        if (relativeDates) {
            SimpleModule relativeModule = new SimpleModule();
            relativeModule.addDeserializer(Instant.class, new RelativeInstantDeserializer(clock));
            builder.addModule(relativeModule);
        }

        ObjectMapper mapper = builder.build();
        for (Class<?> entityType : List.of(Gym.class, BjjEvent.class, Competition.class, Store.class)) {
            mapper.addMixIn(entityType, EntityJsonMixin.class);
        }
        return mapper;
    }

    private interface EntityJsonMixin {
        @JsonProperty("isActive")
        boolean isActive();

        @JsonProperty("isActive")
        void setActive(boolean value);

        @JsonProperty("createdAt")
        Instant getCreatedOnUtc();

        @JsonProperty("createdAt")
        void setCreatedOnUtc(Instant value);

        @JsonProperty("updatedAt")
        Instant getUpdatedOnUtc();

        @JsonProperty("updatedAt")
        void setUpdatedOnUtc(Instant value);
    }
}
