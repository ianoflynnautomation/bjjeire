package com.bjjeire.api.competition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class CompetitionMapperTest {
    @Test
    void toDtoMapsCompetitionFields() {
        Instant startDate = Instant.parse("2026-08-01T09:00:00Z");
        Competition competition = new Competition();
        competition.setId("665624c1ad01ce465c6cf456");
        competition.setSlug("irish-open");
        competition.setName("Irish Open");
        competition.setOrganisation("IBJJF");
        competition.setCountry("Ireland");
        competition.setWebsiteUrl("https://example.com");
        competition.setTags(List.of("gi", "nogi"));
        competition.setStartDate(startDate);
        competition.setActive(true);

        CompetitionDto dto = CompetitionMapper.toDto(competition);

        assertThat(dto.id()).isEqualTo("665624c1ad01ce465c6cf456");
        assertThat(dto.slug()).isEqualTo("irish-open");
        assertThat(dto.name()).isEqualTo("Irish Open");
        assertThat(dto.tags()).containsExactly("gi", "nogi");
        assertThat(dto.startDate()).isEqualTo(startDate);
        assertThat(dto.isActive()).isTrue();
    }
}
