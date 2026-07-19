package com.bjjeire.api.seeder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class RelativeInstantDeserializerTest {
    private static final Instant NOW = Instant.parse("2026-07-18T06:00:00Z");
    private static final ObjectMapper MAPPER = SeederJson.mapper(false, true, Clock.fixed(NOW, ZoneOffset.UTC));

    private record Holder(Instant value) {}

    private static Instant read(String json) throws Exception {
        return MAPPER.readValue("{\"value\": " + json + "}", Holder.class).value();
    }

    @Test
    void nowResolvesToSeedTime() throws Exception {
        assertThat(read("\"now\"")).isEqualTo(NOW);
    }

    @Test
    void offsetsInDaysHoursAndMinutesAreApplied() throws Exception {
        assertThat(read("\"now+7d\"")).isEqualTo(NOW.plus(Duration.ofDays(7)));
        assertThat(read("\"now-30d\"")).isEqualTo(NOW.minus(Duration.ofDays(30)));
        assertThat(read("\"now+12h\"")).isEqualTo(NOW.plus(Duration.ofHours(12)));
        assertThat(read("\"now - 15 m\"")).isEqualTo(NOW.minus(Duration.ofMinutes(15)));
    }

    @Test
    void absoluteDatesPassThroughUnchanged() throws Exception {
        assertThat(read("\"2026-08-01T10:00:00Z\"")).isEqualTo(Instant.parse("2026-08-01T10:00:00Z"));
    }

    @Test
    void zoneLessDatesAreTreatedAsUtc() throws Exception {
        assertThat(read("\"2026-08-01T10:00:00\"")).isEqualTo(Instant.parse("2026-08-01T10:00:00Z"));
    }

    @Test
    void nullStaysNull() throws Exception {
        assertThat(read("null")).isNull();
    }

    @Test
    void malformedRelativeTokenFailsLoudly() {
        assertThatThrownBy(() -> read("\"now+7w\"")).hasMessageContaining("Invalid relative date token");
    }
}
