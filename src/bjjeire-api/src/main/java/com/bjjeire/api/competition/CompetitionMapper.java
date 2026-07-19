package com.bjjeire.api.competition;

import java.util.List;

public final class CompetitionMapper {
    private CompetitionMapper() {}

    public static CompetitionDto toDto(Competition competition) {
        return new CompetitionDto(
                competition.getId(),
                competition.getSlug(),
                competition.getName(),
                competition.getDescription(),
                competition.getOrganisation(),
                competition.getCountry(),
                competition.getWebsiteUrl(),
                competition.getRegistrationUrl(),
                competition.getLogoUrl(),
                competition.getTags() == null ? List.of() : List.copyOf(competition.getTags()),
                competition.getStartDate(),
                competition.getEndDate(),
                competition.isActive());
    }
}
