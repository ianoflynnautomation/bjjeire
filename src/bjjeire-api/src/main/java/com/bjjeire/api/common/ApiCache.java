package com.bjjeire.api.common;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.binder.cache.CaffeineCacheMetrics;
import java.time.Duration;
import java.util.Map;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Per-replica read cache. A write evicts entries only on the replica that handled it. Other replicas keep serving the
 * previous value until {@link #EXPIRATION}. That window is the read-your-writes guarantee across the deployment.
 */
@Component
public class ApiCache {
    public static final String BJJ_EVENTS_TAG = "bjjevents";
    public static final String GYMS_TAG = "gyms";
    public static final String COMPETITIONS_TAG = "competitions";
    public static final String STORES_TAG = "stores";

    private static final Duration EXPIRATION = Duration.ofMinutes(5);
    private static final int MAX_ENTRIES_PER_REGION = 10_000;

    private final Map<String, Cache<String, Object>> regions;

    public ApiCache() {
        this(null);
    }

    @Autowired
    public ApiCache(MeterRegistry meterRegistry) {
        regions = Map.of(
                BJJ_EVENTS_TAG, region(BJJ_EVENTS_TAG, meterRegistry),
                GYMS_TAG, region(GYMS_TAG, meterRegistry),
                COMPETITIONS_TAG, region(COMPETITIONS_TAG, meterRegistry),
                STORES_TAG, region(STORES_TAG, meterRegistry));
    }

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

    private static Cache<String, Object> region(String name, MeterRegistry meterRegistry) {
        Cache<String, Object> cache = Caffeine.newBuilder()
                .expireAfterWrite(EXPIRATION)
                .maximumSize(MAX_ENTRIES_PER_REGION)
                .recordStats()
                .build();
        if (meterRegistry != null) {
            CaffeineCacheMetrics.monitor(meterRegistry, cache, "api.cache", Tags.of("region", name));
        }
        return cache;
    }
}
