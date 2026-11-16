package com.bjjeire.api.competitor;

import java.time.LocalDate;
import java.util.List;

/**
 * The caller's medals (FR-039). Win counts are not shown in this release.
 *
 * @param competitions every competition entered, latest first, with the medals won there
 */
public record CompetitorHistoryDto(int gold, int silver, int bronze, List<CompetitionMedalsDto> competitions) {
    /** Totals of zero and no competitions. */
    public static CompetitorHistoryDto empty() {
        return new CompetitorHistoryDto(0, 0, 0, List.of());
    }

    /**
     * One competition the competitor entered.
     *
     * @param slug the public page address
     * @param date the competition day
     */
    public record CompetitionMedalsDto(
            String competitionId, String slug, String name, LocalDate date, int gold, int silver, int bronze) {}
}
