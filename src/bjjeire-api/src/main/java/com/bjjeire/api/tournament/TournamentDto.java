package com.bjjeire.api.tournament;

import com.bjjeire.api.common.Location;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** A tournament with its divisions, as its page shows it. */
public record TournamentDto(
        String id,
        String slug,
        String name,
        String description,
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
        List<DivisionDto> divisions,
        Long version) {

    /** The same tournament with its registration state worked out for an instant. */
    TournamentDto at(Instant now) {
        return new TournamentDto(
                id,
                slug,
                name,
                description,
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
                divisions,
                version);
    }
}
