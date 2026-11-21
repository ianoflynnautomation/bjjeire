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
 * previous value until the region expires: five minutes, or 30 seconds for {@link #MERCH_TAG}. That window is the
 * read-your-writes guarantee across the deployment.
 */
@Component
public class ApiCache {
    public static final String BJJ_EVENTS_TAG = "bjjevents";
    public static final String GYMS_TAG = "gyms";
    public static final String COMPETITIONS_TAG = "competitions";
    public static final String STORES_TAG = "stores";
    public static final String BJJEIRE_COMPETITIONS_TAG = "bjjeire-competitions";
    /** BJJ Éire merch: the public catalogue. Every product write and stock change clears it (SC-006). */
    public static final String MERCH_TAG = "merch";

    private static final Duration EXPIRATION = Duration.ofMinutes(5);
    /**
     * The merch catalogue's bound. Stock, price and visibility changes must show on Shop within a minute (SC-006), and
     * a write evicts only the replica that served it, so the other replicas rely on this expiry.
     */
    private static final Duration MERCH_EXPIRATION = Duration.ofSeconds(30);

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
                STORES_TAG, region(STORES_TAG, meterRegistry),
                BJJEIRE_COMPETITIONS_TAG, region(BJJEIRE_COMPETITIONS_TAG, meterRegistry),
                MERCH_TAG, region(MERCH_TAG, MERCH_EXPIRATION, meterRegistry));
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

    /** How long an entry in a region is served before it is loaded again. */
    public Duration expiration(String tag) {
        return region(tag)
                .policy()
                .expireAfterWrite()
                .map(policy -> policy.getExpiresAfter())
                .orElseThrow();
    }

    private static Cache<String, Object> region(String name, MeterRegistry meterRegistry) {
        return region(name, EXPIRATION, meterRegistry);
    }

    private static Cache<String, Object> region(String name, Duration expiration, MeterRegistry meterRegistry) {
        Cache<String, Object> cache = Caffeine.newBuilder()
                .expireAfterWrite(expiration)
                .maximumSize(MAX_ENTRIES_PER_REGION)
                .recordStats()
                .build();
        if (meterRegistry != null) {
            CaffeineCacheMetrics.monitor(meterRegistry, cache, "api.cache", Tags.of("region", name));
        }
        return cache;
    }
}
