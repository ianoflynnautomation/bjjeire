package com.bjjeire.api.bjjeirecompetition;

import java.util.List;

/**
 * One division's podium on the public leaderboard (#5028).
 *
 * @param silver null when nobody took silver
 * @param bronzes zero, one or two
 * @param pointsAwarded false when the division has fewer than two confirmed competitors, so its medals add no team
 *     points (FR-035)
 */
public record PodiumDto(
        String divisionId, MedallistDto gold, MedallistDto silver, List<MedallistDto> bronzes, boolean pointsAwarded) {}
