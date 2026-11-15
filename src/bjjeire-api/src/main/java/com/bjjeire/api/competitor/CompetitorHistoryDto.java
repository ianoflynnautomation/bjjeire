package com.bjjeire.api.competitor;

import java.time.LocalDate;
import java.util.List;

/**
 * The caller's medals (FR-039). Win counts are not shown in this release.
 *
 * @param tournaments every tournament entered, latest first, with the medals won there
 */
public record CompetitorHistoryDto(int gold, int silver, int bronze, List<TournamentMedalsDto> tournaments) {
    /** Totals of zero and no tournaments. */
    public static CompetitorHistoryDto empty() {
        return new CompetitorHistoryDto(0, 0, 0, List.of());
    }

    /**
     * One tournament the competitor entered.
     *
     * @param slug the public page address
     * @param date the tournament day
     */
    public record TournamentMedalsDto(
            String tournamentId, String slug, String name, LocalDate date, int gold, int silver, int bronze) {}
}
