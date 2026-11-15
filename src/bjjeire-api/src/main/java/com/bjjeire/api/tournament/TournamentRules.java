package com.bjjeire.api.tournament;

import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** The tournament rules that need no database. */
public final class TournamentRules {
    /** Tournament days and registration windows are read in Irish time. */
    public static final ZoneId ZONE = ZoneId.of("Europe/Dublin");

    private TournamentRules() {}

    /**
     * Works out whether sign-ups are taken at an instant.
     *
     * @param status tournament status; only a published tournament takes sign-ups
     * @param opensAt start of the window, inclusive
     * @param closesAt end of the window, exclusive
     * @param competitorLimit place limit, or null for none
     * @param placesTaken places held or confirmed
     * @param now the instant asked about
     * @return closed wins over full, so a full tournament reads closed once its window ends
     */
    public static RegistrationState registrationState(
            TournamentStatus status,
            Instant opensAt,
            Instant closesAt,
            Integer competitorLimit,
            int placesTaken,
            Instant now) {
        if (status != TournamentStatus.PUBLISHED || opensAt == null || closesAt == null) {
            return RegistrationState.CLOSED;
        }
        if (now.isBefore(opensAt)) {
            return RegistrationState.NOT_OPEN;
        }
        if (!now.isBefore(closesAt)) {
            return RegistrationState.CLOSED;
        }
        if (competitorLimit != null && placesTaken >= competitorLimit) {
            return RegistrationState.FULL;
        }
        return RegistrationState.OPEN;
    }

    /**
     * Checks what a tournament needs before the public may see it.
     *
     * @param tournament the tournament as it would be published
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code no-divisions} or {@code invalid-window}
     */
    public static void requirePublishable(Tournament tournament) {
        if (tournament.getDivisions() == null || tournament.getDivisions().isEmpty()) {
            throw ApiProblems.conflict(
                    ProblemTypes.NO_DIVISIONS, "Add at least one division before publishing the tournament.");
        }
        if (!isValidWindow(
                tournament.getDate(), tournament.getRegistrationOpensAt(), tournament.getRegistrationClosesAt())) {
            throw ApiProblems.conflict(
                    ProblemTypes.INVALID_WINDOW,
                    "Registration must close after it opens and no later than the end of the tournament day.");
        }
    }

    /**
     * Tells whether a registration window fits its tournament day.
     *
     * @param date the tournament day in Irish time
     * @param opensAt start of the window
     * @param closesAt end of the window
     * @return true when the window closes after it opens and not after the day ends
     */
    public static boolean isValidWindow(LocalDate date, Instant opensAt, Instant closesAt) {
        if (date == null || opensAt == null || closesAt == null) {
            return false;
        }
        Instant endOfDay = date.plusDays(1).atStartOfDay(ZONE).toInstant();
        return closesAt.isAfter(opensAt) && !closesAt.isAfter(endOfDay);
    }

    /**
     * Tells whether two divisions share discipline, gender, age category, belt and weight class.
     *
     * @param divisions the full division list of one tournament
     * @return true when any combination appears twice; weight class labels are compared without case or outer spaces
     */
    public static boolean hasDuplicateDivisions(List<Division> divisions) {
        Set<String> seen = new HashSet<>();
        for (Division division : divisions) {
            String key = String.join(
                    "|",
                    String.valueOf(division.getDiscipline()),
                    String.valueOf(division.getGender()),
                    String.valueOf(division.getAgeCategory()),
                    String.valueOf(division.getBelt()),
                    normaliseWeightClass(division.getWeightClass()));
            if (!seen.add(key)) {
                return true;
            }
        }
        return false;
    }

    private static String normaliseWeightClass(String weightClass) {
        return weightClass == null ? "" : weightClass.trim().toLowerCase(Locale.ROOT);
    }
}
