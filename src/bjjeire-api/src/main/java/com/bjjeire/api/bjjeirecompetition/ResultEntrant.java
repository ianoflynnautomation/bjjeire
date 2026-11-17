package com.bjjeire.api.bjjeirecompetition;

/**
 * A sign-up as results and the leaderboard see it: its public snapshot and its team keys, read from the sign-up
 * collection (specs/database-contracts/bjjeire-competition-registration.md). Never leaves the API as is.
 *
 * @param academy the academy name shown, or null for none
 * @param academyKey what academy points group by, or null for none
 * @param affiliationKey what affiliation points group by, or null for none
 */
public record ResultEntrant(
        String registrationId,
        String divisionId,
        String displayName,
        String academy,
        String affiliation,
        String academyKey,
        String affiliationKey) {}
