package com.bjjeire.api.competition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class CompetitionExpiryTest {
    @Test
    void stampExpirySetsExpiresAtToEndDatePlusGrace() {
        Competition competition = new Competition();
        competition.setEndDate(Instant.parse("2026-08-01T12:00:00Z"));

        competition.stampExpiry();

        assertThat(competition.getExpiresAt())
                .isEqualTo(Instant.parse("2026-08-01T12:00:00Z").plus(Competition.EXPIRY_GRACE));
    }

    @Test
    void stampExpiryClearsExpiresAtWhenEndDateIsMissing() {
        Competition competition = new Competition();
        competition.setExpiresAt(Instant.parse("2026-08-01T12:00:00Z"));

        competition.stampExpiry();

        assertThat(competition.getExpiresAt()).isNull();
    }
}
