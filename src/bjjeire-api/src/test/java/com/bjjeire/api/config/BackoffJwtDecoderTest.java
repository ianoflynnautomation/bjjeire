package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

/** The competitor tenant is contacted lazily, and a failure to reach it is not retried on every request. */
class BackoffJwtDecoderTest {
    private final AtomicReference<Instant> now = new AtomicReference<>(Instant.parse("2026-11-13T10:00:00Z"));
    private final Clock clock = new Clock() {
        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now.get();
        }
    };

    @Test
    void shouldNotBuildTheDecoderUntilTheFirstToken() {
        AtomicInteger builds = new AtomicInteger();
        new BackoffJwtDecoder(
                () -> {
                    builds.incrementAndGet();
                    return working();
                },
                Duration.ofSeconds(30),
                clock);

        assertThat(builds).hasValue(0);
    }

    @Test
    void shouldBuildTheDecoderOnceAndReuseIt() {
        AtomicInteger builds = new AtomicInteger();
        BackoffJwtDecoder decoder = new BackoffJwtDecoder(
                () -> {
                    builds.incrementAndGet();
                    return working();
                },
                Duration.ofSeconds(30),
                clock);

        decoder.decode("a");
        decoder.decode("b");

        assertThat(builds).hasValue(1);
    }

    @Test
    void shouldNotRetryAFailedBuildUntilTheBackoffHasPassed() {
        AtomicInteger builds = new AtomicInteger();
        BackoffJwtDecoder decoder = new BackoffJwtDecoder(
                () -> {
                    if (builds.incrementAndGet() < 3) {
                        throw new IllegalStateException("discovery failed");
                    }
                    return working();
                },
                Duration.ofSeconds(30),
                clock);

        assertThatThrownBy(() -> decoder.decode("a")).isInstanceOf(BadJwtException.class);
        assertThatThrownBy(() -> decoder.decode("b")).isInstanceOf(BadJwtException.class);
        assertThat(builds).as("second call inside the back-off").hasValue(1);

        now.set(now.get().plusSeconds(31));
        assertThatThrownBy(() -> decoder.decode("c")).isInstanceOf(BadJwtException.class);
        assertThat(builds).hasValue(2);

        now.set(now.get().plusSeconds(31));
        assertThat(decoder.decode("d").getSubject()).isEqualTo("ok");
        assertThat(builds).hasValue(3);
    }

    private static JwtDecoder working() {
        return token -> Jwt.withTokenValue(token)
                .header("alg", "none")
                .claim("sub", "ok")
                .build();
    }
}
