package com.bjjeire.api.competitor;

/** Maps the profile document to the owner's view of it. */
final class CompetitorMapper {
    private CompetitorMapper() {}

    static CompetitorDto toDto(Competitor competitor) {
        return new CompetitorDto(
                competitor.getEmail(),
                competitor.getFirstName(),
                competitor.getMiddleName(),
                competitor.getLastName(),
                competitor.getNationality(),
                competitor.getDateOfBirth(),
                competitor.getGender(),
                competitor.getBelt(),
                competitor.getAcademy(),
                competitor.getAffiliation(),
                competitor.getPhone(),
                competitor.getAddress(),
                competitor.isProfileComplete(),
                true);
    }
}
