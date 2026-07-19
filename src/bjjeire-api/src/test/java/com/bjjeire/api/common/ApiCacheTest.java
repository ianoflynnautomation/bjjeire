package com.bjjeire.api.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class ApiCacheTest {
    private final ApiCache cache = new ApiCache();

    @Test
    void getOrCreateLoadsOnceAndCaches() {
        AtomicInteger loads = new AtomicInteger();

        String first = cache.getOrCreate(ApiCache.GYMS_TAG, "key", () -> "value-" + loads.incrementAndGet());
        String second = cache.getOrCreate(ApiCache.GYMS_TAG, "key", () -> "value-" + loads.incrementAndGet());

        assertThat(first).isEqualTo("value-1");
        assertThat(second).isEqualTo("value-1");
        assertThat(loads.get()).isEqualTo(1);
    }

    @Test
    void removeByTagClearsOnlyThatRegion() {
        cache.put(ApiCache.GYMS_TAG, "key", "gym");
        cache.put(ApiCache.STORES_TAG, "key", "store");

        cache.removeByTag(ApiCache.GYMS_TAG);

        assertThat(cache.<String>getOrCreate(ApiCache.GYMS_TAG, "key", () -> "reloaded"))
                .isEqualTo("reloaded");
        assertThat(cache.<String>getOrCreate(ApiCache.STORES_TAG, "key", () -> "reloaded"))
                .isEqualTo("store");
    }

    @Test
    void removeEvictsSingleKey() {
        cache.put(ApiCache.BJJ_EVENTS_TAG, "a", "1");
        cache.put(ApiCache.BJJ_EVENTS_TAG, "b", "2");

        cache.remove(ApiCache.BJJ_EVENTS_TAG, "a");

        assertThat(cache.<String>getOrCreate(ApiCache.BJJ_EVENTS_TAG, "a", () -> "reloaded"))
                .isEqualTo("reloaded");
        assertThat(cache.<String>getOrCreate(ApiCache.BJJ_EVENTS_TAG, "b", () -> "reloaded"))
                .isEqualTo("2");
    }

    @Test
    void nullLoaderResultIsNotCached() {
        AtomicInteger loads = new AtomicInteger();

        assertThat(cache.<String>getOrCreate(ApiCache.COMPETITIONS_TAG, "missing", () -> {
                    loads.incrementAndGet();
                    return null;
                }))
                .isNull();
        assertThat(cache.<String>getOrCreate(ApiCache.COMPETITIONS_TAG, "missing", () -> {
                    loads.incrementAndGet();
                    return null;
                }))
                .isNull();

        assertThat(loads.get()).isEqualTo(2);
    }

    @Test
    void unknownTagIsRejected() {
        assertThatThrownBy(() -> cache.put("nope", "key", "value")).isInstanceOf(IllegalArgumentException.class);
    }
}
