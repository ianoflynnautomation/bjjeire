package com.bjjeire.api.bjjeirecompetition;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Results and the leaderboard of BJJ Éire competitions (US5). */
public interface ResultService {
    /**
     * Returns the public leaderboard (FR-032 to FR-035, FR-040). Cached; every result, merge, move and cancellation
     * write evicts it.
     *
     * @param competitionId competition id
     * @return the leaderboard, or empty when the id is unknown or the competition is a draft
     */
    Optional<LeaderboardDto> getLeaderboard(String competitionId);

    /**
     * Lists each division's result and confirmed competitors for the organiser's results tab.
     *
     * @param competitionId competition id
     * @return one entry per division in the competition's order, or empty when the id is unknown
     */
    Optional<List<AdminDivisionResultDto>> getForAdmin(String competitionId);

    /**
     * Records or replaces a division's podium (FR-031).
     *
     * @param competitionId competition id
     * @param divisionId division id
     * @param command gold, optional silver, up to two bronzes
     * @return the division as the results tab shows it, or empty when the competition or division is unknown
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code not-in-division} when an id is not a
     *     confirmed sign-up in that division, 409 {@code duplicate-medallist} when an id repeats, 409 when the
     *     competition is neither published nor finished or changed meanwhile
     */
    Optional<AdminDivisionResultDto> record(String competitionId, String divisionId, RecordResultCommand command);

    /**
     * Removes a division's podium.
     *
     * @param competitionId competition id
     * @param divisionId division id
     * @return false when the competition or division is unknown
     * @throws org.springframework.web.server.ResponseStatusException 409 when the competition is neither published nor
     *     finished, or changed meanwhile
     */
    boolean clear(String competitionId, String divisionId);

    /**
     * Tells whether a recorded result names a sign-up, which then can no longer be cancelled or moved (FR-026).
     *
     * @param competitionId the sign-up's competition
     * @param registrationId the sign-up
     * @return true when it holds a medal
     */
    boolean isNamedInResult(String competitionId, String registrationId);

    /**
     * Counts the medals some sign-ups won, per competition (FR-039).
     *
     * @param registrations the sign-ups, each with its competition id
     * @return one entry per competition a draft is not, latest day first
     */
    List<CompetitionMedals> medalsFor(Collection<SignUpRef> registrations);

    /**
     * A sign-up named by its competition and its id.
     *
     * @param competitionId the competition
     * @param registrationId the sign-up
     */
    record SignUpRef(String competitionId, String registrationId) {}
}
