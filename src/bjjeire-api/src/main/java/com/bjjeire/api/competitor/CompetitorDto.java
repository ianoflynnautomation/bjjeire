package com.bjjeire.api.competitor;

import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Gender;
import java.time.LocalDate;

/**
 * The caller's own profile. Carries no id, issuer or subject: no route takes a competitor id (#5009).
 *
 * @param email from the sign-in token
 * @param profileComplete whether the profile holds everything a sign-up needs
 * @param saved false before the first save: then only {@code email} is set and every other field is null
 */
public record CompetitorDto(
        String email,
        String firstName,
        String middleName,
        String lastName,
        String nationality,
        LocalDate dateOfBirth,
        Gender gender,
        Belt belt,
        Academy academy,
        String affiliation,
        String phone,
        PostalAddress address,
        boolean profileComplete,
        boolean saved) {
    /** The profile of a signed-in competitor who has not saved one yet. */
    static CompetitorDto unsaved(String email) {
        return new CompetitorDto(email, null, null, null, null, null, null, null, null, null, null, null, false, false);
    }
}
