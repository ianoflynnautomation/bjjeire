package com.bjjeire.api.bjjeirecompetition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/** The points calculation behind the leaderboard (FR-032 to FR-035, FR-040). */
class LeaderboardsTest {
    private final Map<String, ResultEntrant> entrants = new HashMap<>();
    private final List<Division> divisions = new ArrayList<>();

    @Test
    @Tag("#5029")
    @Tag("#5040")
    void shouldAwardNinePerGoldThreePerSilverAndOnePerBronzePerAcademyAndAffiliation() {
        division("d1", 4, "a1", "a2", "a3", "a4");
        division("d2", 4, "b1", "b2", "b3", null);
        entrant("a1", "Team X", "Alliance");
        entrant("a2", "Team Y", "Alliance");
        entrant("a3", "Team X", "Alliance");
        entrant("a4", "Team Z", "Checkmat");
        entrant("b1", "Team Y", "Alliance");
        entrant("b2", "Team X", "Alliance");
        entrant("b3", "Team Z", "Checkmat");

        LeaderboardDto board = calculate(BjjEireCompetitionStatus.PUBLISHED);

        assertThat(board.academyRanking())
                .extracting(TeamStandingDto::name, TeamStandingDto::points)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Team X", 9 + 1 + 3),
                        org.assertj.core.groups.Tuple.tuple("Team Y", 3 + 9),
                        org.assertj.core.groups.Tuple.tuple("Team Z", 1 + 1));
        assertThat(board.affiliationRanking())
                .extracting(TeamStandingDto::name, TeamStandingDto::points, TeamStandingDto::gold)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Alliance", 9 + 3 + 1 + 9 + 3, 2),
                        org.assertj.core.groups.Tuple.tuple("Checkmat", 2, 0));
        assertThat(board.podiums()).hasSize(2);
        assertThat(board.podiums().getFirst().gold().displayName()).isEqualTo("a1 name");
        assertThat(board.podiums().getFirst().bronzes())
                .extracting(MedallistDto::displayName)
                .containsExactly("a3 name", "a4 name");
    }

    @Test
    @Tag("#5030")
    void shouldBreakTiesOnGoldsThenSilversThenBronzes() {
        // Team G: one gold (9). Team S: three silvers (9), so level on points and behind on golds.
        division("d1", 2, "g1", "s1", null, null);
        division("d2", 2, "x1", "s2", null, null);
        division("d3", 2, "x2", "s3", null, null);
        division("d4", 4, "x3", "b1", "b2", "b3");
        division("d5", 4, "x4", "b4", "b5", null);
        entrant("g1", "Team G", null);
        entrant("s1", "Team S", null);
        entrant("s2", "Team S", null);
        entrant("s3", "Team S", null);
        entrant("b1", "Team B", null);
        entrant("b2", "Team B", null);
        entrant("b3", "Team B", null);
        entrant("b4", "Team B", null);
        entrant("b5", "Team C", null);
        for (String other : List.of("x1", "x2", "x3", "x4")) {
            entrant(other, null, null);
        }

        LeaderboardDto board = calculate(BjjEireCompetitionStatus.PUBLISHED);

        // Team B: two silvers and two bronzes (8). Team C: one bronze (1).
        assertThat(board.academyRanking())
                .extracting(TeamStandingDto::name)
                .containsExactly("Team G", "Team S", "Team B", "Team C");
        assertThat(board.academyRanking()).extracting(TeamStandingDto::points).containsExactly(9, 9, 8, 1);
        assertThat(board.academyRanking()).extracting(TeamStandingDto::rank).containsExactly(1, 2, 3, 4);
    }

    @Test
    @Tag("#5030")
    void shouldRankSilversAheadOfBronzesWhenPointsAndGoldsAreLevel() {
        // Team S: one silver (3). Team B: three bronzes (3).
        division("d1", 4, "x1", "s1", "b1", "b2");
        division("d2", 4, "x2", "x3", "b3", null);
        entrant("s1", "Team S", null);
        entrant("b1", "Team B", null);
        entrant("b2", "Team B", null);
        entrant("b3", "Team B", null);
        entrant("x1", null, null);
        entrant("x2", null, null);
        entrant("x3", null, null);

        assertThat(calculate(BjjEireCompetitionStatus.PUBLISHED).academyRanking())
                .extracting(TeamStandingDto::name)
                .containsExactly("Team S", "Team B");
    }

    @Test
    @Tag("#5031")
    void shouldShowAMedallistWithNoAcademyOrAffiliationOnThePodiumOnly() {
        division("d1", 3, "a1", "a2", null, null);
        entrant("a1", null, "Alliance");
        entrant("a2", "Team X", null);

        LeaderboardDto board = calculate(BjjEireCompetitionStatus.PUBLISHED);

        assertThat(board.podiums().getFirst().gold().displayName()).isEqualTo("a1 name");
        assertThat(board.academyRanking())
                .extracting(TeamStandingDto::name, TeamStandingDto::points)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Team X", 3));
        assertThat(board.affiliationRanking())
                .extracting(TeamStandingDto::name, TeamStandingDto::points)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Alliance", 9));
    }

    @Test
    @Tag("#5032")
    void shouldAwardNoPointsInADivisionWithOneConfirmedCompetitor() {
        division("d1", 1, "a1", null, null, null);
        entrant("a1", "Team X", "Alliance");

        LeaderboardDto board = calculate(BjjEireCompetitionStatus.PUBLISHED);

        assertThat(board.podiums()).hasSize(1);
        assertThat(board.podiums().getFirst().pointsAwarded()).isFalse();
        assertThat(board.academyRanking()).isEmpty();
        assertThat(board.affiliationRanking()).isEmpty();
    }

    @Test
    @Tag("#5029")
    void shouldGroupAcademiesByKeyWhateverTheSpelling() {
        division("d1", 2, "a1", "a2", null, null);
        entrants.put("a1", new ResultEntrant("a1", "d1", "a1 name", "Team X", null, "name:team x", null));
        entrants.put("a2", new ResultEntrant("a2", "d1", "a2 name", " team  x", null, "name:team x", null));

        assertThat(calculate(BjjEireCompetitionStatus.PUBLISHED).academyRanking())
                .extracting(TeamStandingDto::name, TeamStandingDto::points)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Team X", 12));
    }

    @Test
    @Tag("#5034")
    void shouldBeEmptyWithNoResults() {
        divisions.add(Division.builder().id("d1").build());

        LeaderboardDto board = calculate(BjjEireCompetitionStatus.FINISHED);

        assertThat(board.podiums()).isEmpty();
        assertThat(board.academyRanking()).isEmpty();
        assertThat(board.affiliationRanking()).isEmpty();
        assertThat(board.winners()).isNotNull();
        assertThat(board.winners().academies()).isEmpty();
    }

    @Test
    @Tag("#5041")
    void shouldNameWinnersOnlyOnceTheCompetitionIsFinished() {
        division("d1", 2, "a1", "a2", null, null);
        entrant("a1", "Team X", "Alliance");
        entrant("a2", "Team Y", "Checkmat");

        assertThat(calculate(BjjEireCompetitionStatus.PUBLISHED).winners()).isNull();
        WinnersDto winners = calculate(BjjEireCompetitionStatus.FINISHED).winners();
        assertThat(winners.academies()).containsExactly("Team X");
        assertThat(winners.affiliations()).containsExactly("Alliance");
    }

    @Test
    @Tag("#5041")
    void shouldNameJointWinnersWhenLevelOnEveryTieBreak() {
        division("d1", 2, "a1", "b1", null, null);
        division("d2", 2, "b2", "a2", null, null);
        entrant("a1", "Team A", "Alliance");
        entrant("a2", "Team A", "Alliance");
        entrant("b1", "Team B", "Checkmat");
        entrant("b2", "Team B", "Checkmat");

        LeaderboardDto board = calculate(BjjEireCompetitionStatus.FINISHED);

        assertThat(board.winners().academies()).containsExactlyInAnyOrder("Team A", "Team B");
        assertThat(board.winners().affiliations()).containsExactlyInAnyOrder("Alliance", "Checkmat");
        assertThat(board.academyRanking()).extracting(TeamStandingDto::rank).containsExactly(1, 1);
    }

    @Test
    @Tag("#5028")
    void shouldListPodiumsInTheCompetitionsDivisionOrder() {
        divisions.add(Division.builder().id("d0").build());
        division("d2", 2, "b1", null, null, null);
        division("d1", 2, "a1", null, null, null);
        entrant("a1", "Team A", null);
        entrant("b1", "Team B", null);

        assertThat(calculate(BjjEireCompetitionStatus.PUBLISHED).podiums())
                .extracting(PodiumDto::divisionId)
                .containsExactly("d2", "d1");
    }

    private LeaderboardDto calculate(BjjEireCompetitionStatus status) {
        return Leaderboards.calculate(status, divisions, entrants);
    }

    private void division(String id, int confirmedCount, String gold, String silver, String bronze1, String bronze2) {
        List<String> bronzes = new ArrayList<>();
        if (bronze1 != null) {
            bronzes.add(bronze1);
        }
        if (bronze2 != null) {
            bronzes.add(bronze2);
        }
        divisions.add(Division.builder()
                .id(id)
                .result(DivisionResult.builder()
                        .goldRegistrationId(gold)
                        .silverRegistrationId(silver)
                        .bronzeRegistrationIds(bronzes)
                        .confirmedCompetitors(confirmedCount)
                        .recordedAt(Instant.EPOCH)
                        .recordedBy("organiser")
                        .build())
                .build());
    }

    private void entrant(String id, String academy, String affiliation) {
        entrants.put(
                id,
                new ResultEntrant(
                        id,
                        null,
                        id + " name",
                        academy,
                        affiliation,
                        academy == null ? null : "name:" + academy.toLowerCase(java.util.Locale.ROOT),
                        affiliation == null ? null : affiliation.toLowerCase(java.util.Locale.ROOT)));
    }
}
