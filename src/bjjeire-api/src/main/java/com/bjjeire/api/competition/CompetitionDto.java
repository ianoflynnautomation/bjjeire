package com.bjjeire.api.competition;

import java.time.Instant;
import java.util.List;

public record CompetitionDto(
        String id,
        String slug,
        String name,
        String description,
        String organisation,
        String country,
        String websiteUrl,
        String registrationUrl,
        String logoUrl,
        List<String> tags,
        Instant startDate,
        Instant endDate,
        boolean isActive) {}
