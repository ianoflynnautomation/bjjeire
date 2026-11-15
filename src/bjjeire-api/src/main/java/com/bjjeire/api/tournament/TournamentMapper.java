package com.bjjeire.api.tournament;

import java.time.Instant;
import java.util.List;

public final class TournamentMapper {
    private TournamentMapper() {}

    public static TournamentDto toDto(Tournament tournament, Instant now) {
        return new TournamentDto(
                tournament.getId(),
                tournament.getSlug(),
                tournament.getName(),
                tournament.getDescription(),
                tournament.getDate(),
                tournament.getVenue(),
                tournament.getEntryFeeCents(),
                tournament.getCurrency(),
                tournament.getRegistrationOpensAt(),
                tournament.getRegistrationClosesAt(),
                tournament.getCompetitorLimit(),
                tournament.getPlacesTaken(),
                tournament.getStatus(),
                registrationState(tournament, now),
                divisions(tournament).stream().map(TournamentMapper::toDto).toList(),
                tournament.getVersion());
    }

    public static TournamentSummaryDto toSummary(Tournament tournament, Instant now) {
        return new TournamentSummaryDto(
                tournament.getId(),
                tournament.getSlug(),
                tournament.getName(),
                tournament.getDate(),
                tournament.getVenue(),
                tournament.getEntryFeeCents(),
                tournament.getCurrency(),
                tournament.getRegistrationOpensAt(),
                tournament.getRegistrationClosesAt(),
                tournament.getCompetitorLimit(),
                tournament.getPlacesTaken(),
                tournament.getStatus(),
                registrationState(tournament, now),
                divisions(tournament).size());
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

    private static RegistrationState registrationState(Tournament tournament, Instant now) {
        return TournamentRules.registrationState(
                tournament.getStatus(),
                tournament.getRegistrationOpensAt(),
                tournament.getRegistrationClosesAt(),
                tournament.getCompetitorLimit(),
                tournament.getPlacesTaken(),
                now);
    }

    private static List<Division> divisions(Tournament tournament) {
        return tournament.getDivisions() == null ? List.of() : tournament.getDivisions();
    }
}
