package com.bjjeire.api.common;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.Map;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;

/**
 * In-process cache: one region per cache tag with the same 5-minute expiration, where "remove by tag" clears the whole
 * region (list pages + by-id entries for that entity).
 */
@Component
public class ApiCache {
    public static final String BJJ_EVENTS_TAG = "bjjevents";
    public static final String GYMS_TAG = "gyms";
    public static final String COMPETITIONS_TAG = "competitions";
    public static final String STORES_TAG = "stores";

    private static final Duration EXPIRATION = Duration.ofMinutes(5);
    private static final int MAX_ENTRIES_PER_REGION = 10_000;

    private final Map<String, Cache<String, Object>> regions = Map.of(
            BJJ_EVENTS_TAG, newRegion(),
            GYMS_TAG, newRegion(),
            COMPETITIONS_TAG, newRegion(),
            STORES_TAG, newRegion());

    @SuppressWarnings("unchecked")
    public <T> T getOrCreate(String tag, String key, Supplier<T> loader) {
        return (T) region(tag).get(key, ignored -> loader.get());
    }

    public void put(String tag, String key, Object value) {
        region(tag).put(key, value);
    }

    public void remove(String tag, String key) {
        region(tag).invalidate(key);
    }

    public void removeByTag(String tag) {
        region(tag).invalidateAll();
    }

    private Cache<String, Object> region(String tag) {
        Cache<String, Object> region = regions.get(tag);
        if (region == null) {
            throw new IllegalArgumentException("Unknown cache tag '" + tag + "'.");
        }
        return region;
    }

    private static Cache<String, Object> newRegion() {
        return Caffeine.newBuilder()
                .expireAfterWrite(EXPIRATION)
                .maximumSize(MAX_ENTRIES_PER_REGION)
                .recordStats()
                .build();
    }
}
