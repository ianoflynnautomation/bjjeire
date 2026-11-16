package com.bjjeire.api.bjjeirecompetition;

import java.time.Instant;
import java.util.List;

public final class BjjEireCompetitionMapper {
    private BjjEireCompetitionMapper() {}

    public static BjjEireCompetitionDto toDto(BjjEireCompetition competition, Instant now) {
        return new BjjEireCompetitionDto(
                competition.getId(),
                competition.getSlug(),
                competition.getName(),
                competition.getDescription(),
                competition.getDate(),
                competition.getVenue(),
                competition.getEntryFeeCents(),
                competition.getCurrency(),
                competition.getRegistrationOpensAt(),
                competition.getRegistrationClosesAt(),
                competition.getCompetitorLimit(),
                competition.getPlacesTaken(),
                competition.getStatus(),
                registrationState(competition, now),
                divisions(competition).stream()
                        .map(BjjEireCompetitionMapper::toDto)
                        .toList(),
                competition.getVersion());
    }

    public static BjjEireCompetitionSummaryDto toSummary(BjjEireCompetition competition, Instant now) {
        return new BjjEireCompetitionSummaryDto(
                competition.getId(),
                competition.getSlug(),
                competition.getName(),
                competition.getDate(),
                competition.getVenue(),
                competition.getEntryFeeCents(),
                competition.getCurrency(),
                competition.getRegistrationOpensAt(),
                competition.getRegistrationClosesAt(),
                competition.getCompetitorLimit(),
                competition.getPlacesTaken(),
                competition.getStatus(),
                registrationState(competition, now),
                divisions(competition).size());
    }

    public static DivisionDto toDto(Division division) {
        return new DivisionDto(
                division.getId(),
                division.getDiscipline(),
                division.getGender(),
                division.getAgeCategory(),
                division.getBelt(),
                division.getWeightClass());
    }

    public static Division toDivision(DivisionDto dto, String id) {
        return Division.builder()
                .id(id)
                .discipline(dto.discipline())
                .gender(dto.gender())
                .ageCategory(dto.ageCategory())
                .belt(dto.belt())
                .weightClass(dto.weightClass().trim())
                .build();
    }

    private static RegistrationState registrationState(BjjEireCompetition competition, Instant now) {
        return BjjEireCompetitionRules.registrationState(
                competition.getStatus(),
                competition.getRegistrationOpensAt(),
                competition.getRegistrationClosesAt(),
                competition.getCompetitorLimit(),
                competition.getPlacesTaken(),
                now);
    }

    private static List<Division> divisions(BjjEireCompetition competition) {
        return competition.getDivisions() == null ? List.of() : competition.getDivisions();
    }
}
