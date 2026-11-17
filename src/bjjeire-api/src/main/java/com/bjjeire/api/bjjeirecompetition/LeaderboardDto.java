package com.bjjeire.api.bjjeirecompetition;

import java.util.List;

/**
 * A competition's public leaderboard (FR-032 to FR-035, FR-040).
 *
 * @param podiums divisions with a recorded result, in the competition's division order
 * @param academyRanking highest first; ties broken by golds, then silvers, then bronzes
 * @param affiliationRanking likewise
 * @param winners present only once the competition is finished
 */
public record LeaderboardDto(
        List<PodiumDto> podiums,
        List<TeamStandingDto> academyRanking,
        List<TeamStandingDto> affiliationRanking,
        WinnersDto winners) {}
