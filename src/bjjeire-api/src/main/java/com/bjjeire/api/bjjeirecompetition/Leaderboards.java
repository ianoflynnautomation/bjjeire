package com.bjjeire.api.bjjeirecompetition;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Works out a leaderboard from recorded results (FR-032 to FR-035, FR-040). Pure: no database, no clock.
 *
 * <p>Every medal adds {@link Medal#points()} to the medallist's academy and to their affiliation, grouped by key, so
 * differently typed names of one team count together once merged. A division with fewer than two confirmed competitors
 * adds nothing. Rankings order by points, golds, silvers, bronzes; entries level on all four share a rank, and at the
 * top they are joint winners.
 */
final class Leaderboards {
    /** A division awards team points only with at least this many confirmed competitors (FR-035). */
    static final int MINIMUM_FOR_POINTS = 2;

    private static final Comparator<Standing> RANKING = Comparator.comparingInt(Standing::points)
            .thenComparingInt(Standing::gold)
            .thenComparingInt(Standing::silver)
            .thenComparingInt(Standing::bronze)
            .reversed();

    private Leaderboards() {}

    /**
     * @param status the competition's status; winners are named only when {@code FINISHED}
     * @param divisions the competition's divisions in its order, with their results
     * @param entrants the sign-ups named in any result, by registration id
     * @param confirmedPerDivision confirmed sign-ups now in each division, by division id
     */
    static LeaderboardDto calculate(
            BjjEireCompetitionStatus status,
            List<Division> divisions,
            Map<String, ResultEntrant> entrants,
            Map<String, Integer> confirmedPerDivision) {
        List<PodiumDto> podiums = new ArrayList<>();
        Map<String, Standing> academies = new LinkedHashMap<>();
        Map<String, Standing> affiliations = new LinkedHashMap<>();

        for (Division division : divisions) {
            DivisionResult result = division.getResult();
            ResultEntrant gold = result == null ? null : entrants.get(result.getGoldRegistrationId());
            if (gold == null) {
                continue;
            }
            ResultEntrant silver =
                    result.getSilverRegistrationId() == null ? null : entrants.get(result.getSilverRegistrationId());
            List<ResultEntrant> bronzes = bronzes(result, entrants);
            boolean pointsAwarded = confirmedPerDivision.getOrDefault(division.getId(), 0) >= MINIMUM_FOR_POINTS;
            podiums.add(new PodiumDto(
                    division.getId(),
                    medallist(gold),
                    silver == null ? null : medallist(silver),
                    bronzes.stream().map(Leaderboards::medallist).toList(),
                    pointsAwarded));
            if (pointsAwarded) {
                award(academies, affiliations, gold, Medal.GOLD);
                if (silver != null) {
                    award(academies, affiliations, silver, Medal.SILVER);
                }
                bronzes.forEach(bronze -> award(academies, affiliations, bronze, Medal.BRONZE));
            }
        }

        List<TeamStandingDto> academyRanking = rank(academies);
        List<TeamStandingDto> affiliationRanking = rank(affiliations);
        WinnersDto winners = status == BjjEireCompetitionStatus.FINISHED
                ? new WinnersDto(top(academyRanking), top(affiliationRanking))
                : null;
        return new LeaderboardDto(List.copyOf(podiums), academyRanking, affiliationRanking, winners);
    }

    private static List<ResultEntrant> bronzes(DivisionResult result, Map<String, ResultEntrant> entrants) {
        if (result.getBronzeRegistrationIds() == null) {
            return List.of();
        }
        return result.getBronzeRegistrationIds().stream()
                .map(entrants::get)
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    private static MedallistDto medallist(ResultEntrant entrant) {
        return new MedallistDto(entrant.displayName(), entrant.academy(), entrant.affiliation());
    }

    private static void award(
            Map<String, Standing> academies, Map<String, Standing> affiliations, ResultEntrant entrant, Medal medal) {
        if (entrant.academyKey() != null) {
            academies
                    .computeIfAbsent(entrant.academyKey(), key -> new Standing(nameOr(entrant.academy(), key)))
                    .add(medal);
        }
        if (entrant.affiliationKey() != null) {
            affiliations
                    .computeIfAbsent(entrant.affiliationKey(), key -> new Standing(nameOr(entrant.affiliation(), key)))
                    .add(medal);
        }
    }

    private static String nameOr(String name, String key) {
        return name == null || name.isBlank() ? key : name.trim();
    }

    private static List<TeamStandingDto> rank(Map<String, Standing> standings) {
        List<Standing> ordered = new ArrayList<>(standings.values());
        // Stable sort: entries level on every tie-break keep the order their first medal appeared in.
        ordered.sort(RANKING);
        List<TeamStandingDto> ranking = new ArrayList<>();
        int rank = 0;
        Standing previous = null;
        for (int i = 0; i < ordered.size(); i++) {
            Standing current = ordered.get(i);
            if (previous == null || RANKING.compare(previous, current) != 0) {
                rank = i + 1;
            }
            ranking.add(new TeamStandingDto(
                    rank, current.name, current.points(), current.gold, current.silver, current.bronze));
            previous = current;
        }
        return List.copyOf(ranking);
    }

    private static List<String> top(List<TeamStandingDto> ranking) {
        return ranking.stream()
                .filter(standing -> standing.rank() == 1)
                .map(TeamStandingDto::name)
                .toList();
    }

    /** A team's running total while the medals are added up. */
    private static final class Standing {
        private final String name;
        private int gold;
        private int silver;
        private int bronze;

        Standing(String name) {
            this.name = name;
        }

        void add(Medal medal) {
            if (medal == Medal.GOLD) {
                gold++;
            } else if (medal == Medal.SILVER) {
                silver++;
            } else {
                bronze++;
            }
        }

        int points() {
            return gold * Medal.GOLD.points() + silver * Medal.SILVER.points() + bronze * Medal.BRONZE.points();
        }

        int gold() {
            return gold;
        }

        int silver() {
            return silver;
        }

        int bronze() {
            return bronze;
        }
    }
}
