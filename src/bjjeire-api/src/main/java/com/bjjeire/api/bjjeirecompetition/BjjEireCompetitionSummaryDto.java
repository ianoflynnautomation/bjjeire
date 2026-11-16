package com.bjjeire.api.bjjeirecompetition;

import com.bjjeire.api.common.Location;
import java.time.Instant;
import java.time.LocalDate;

/** A competition as a list shows it. */
public record BjjEireCompetitionSummaryDto(
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
        BjjEireCompetitionStatus status,
        RegistrationState registrationState,
        int divisionCount) {

    /** The same summary with its registration state worked out for an instant. */
    BjjEireCompetitionSummaryDto at(Instant now) {
        return new BjjEireCompetitionSummaryDto(
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
                BjjEireCompetitionRules.registrationState(
                        status, registrationOpensAt, registrationClosesAt, competitorLimit, placesTaken, now),
                divisionCount);
    }
}
