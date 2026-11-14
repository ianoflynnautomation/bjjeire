package com.bjjeire.api.tournament;

import com.bjjeire.api.common.Location;
import java.time.Instant;
import java.time.LocalDate;

/** A tournament as a list shows it. */
public record TournamentSummaryDto(
        String id,
        String slug,
        String name,
        LocalDate date,
        Location venue,
        int entryFeeCents,
        String currency,
        Instant registrationOpensAt,
        Instant registrationClosesAt,
        Integer competitorLimit,
        int placesTaken,
        TournamentStatus status,
        RegistrationState registrationState,
        int divisionCount) {

    /** The same summary with its registration state worked out for an instant. */
    TournamentSummaryDto at(Instant now) {
        return new TournamentSummaryDto(
                id,
                slug,
                name,
                date,
                venue,
                entryFeeCents,
                currency,
                registrationOpensAt,
                registrationClosesAt,
                competitorLimit,
                placesTaken,
                status,
                TournamentRules.registrationState(
                        status, registrationOpensAt, registrationClosesAt, competitorLimit, placesTaken, now),
                divisionCount);
    }
}
