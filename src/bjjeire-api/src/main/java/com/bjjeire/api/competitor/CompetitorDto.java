package com.bjjeire.api.competitor;

import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Gender;
import java.time.LocalDate;

/**
 * The caller's own profile. Carries no id, issuer or subject: no route takes a competitor id (#5009).
 *
 * @param email from the sign-in token
 * @param profileComplete whether the profile holds everything a sign-up needs
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
        boolean profileComplete) {}
