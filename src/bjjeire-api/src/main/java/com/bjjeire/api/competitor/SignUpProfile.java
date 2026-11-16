package com.bjjeire.api.competitor;

import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Gender;
import java.time.LocalDate;

/**
 * What a sign-up needs from the caller's profile. Never serialised: the {@code registration} package copies only the
 * public fields (name, academy, affiliation) into a sign-up (FR-011).
 *
 * @param competitorId the profile's id, which sign-ups refer to
 * @param email from the sign-in, for the Checkout page and the confirmation mail
 * @param displayName first and last name, as competitor lists show it
 * @param academy null for "no academy"
 * @param affiliation null for none
 * @param profileComplete whether every field a sign-up needs is present
 */
public record SignUpProfile(
        String competitorId,
        String email,
        String displayName,
        LocalDate dateOfBirth,
        Gender gender,
        Belt belt,
        Academy academy,
        String affiliation,
        boolean profileComplete) {
    static SignUpProfile of(Competitor competitor) {
        return new SignUpProfile(
                competitor.getId(),
                competitor.getEmail(),
                displayName(competitor),
                competitor.getDateOfBirth(),
                competitor.getGender(),
                competitor.getBelt(),
                competitor.getAcademy(),
                competitor.getAffiliation(),
                competitor.isProfileComplete());
    }

    static String displayName(Competitor competitor) {
        return (competitor.getFirstName() + " " + competitor.getLastName()).trim();
    }
}
