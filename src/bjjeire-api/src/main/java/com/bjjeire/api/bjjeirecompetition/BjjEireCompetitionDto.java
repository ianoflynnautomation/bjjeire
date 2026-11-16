package com.bjjeire.api.bjjeirecompetition;

import com.bjjeire.api.common.Location;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** A competition with its divisions, as its page shows it. */
public record BjjEireCompetitionDto(
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
        BjjEireCompetitionStatus status,
        RegistrationState registrationState,
        List<DivisionDto> divisions,
        Long version) {

    /** The same competition with its registration state worked out for an instant. */
    BjjEireCompetitionDto at(Instant now) {
        return new BjjEireCompetitionDto(
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
                BjjEireCompetitionRules.registrationState(
                        status, registrationOpensAt, registrationClosesAt, competitorLimit, placesTaken, now),
                divisions,
                version);
    }
}
