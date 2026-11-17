package com.bjjeire.api.bjjeirecompetition;

import java.time.LocalDate;

/**
 * The medals some sign-ups won at one competition, for a competitor's history (FR-039).
 *
 * @param slug the public page address
 */
public record CompetitionMedals(
        String competitionId, String slug, String name, LocalDate date, int gold, int silver, int bronze) {}
