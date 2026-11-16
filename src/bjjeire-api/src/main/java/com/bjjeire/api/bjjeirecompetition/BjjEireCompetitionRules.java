package com.bjjeire.api.bjjeirecompetition;

import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** The competition rules that need no database. */
public final class BjjEireCompetitionRules {
    /** BJJ Éire competition days and registration windows are read in Irish time. */
    public static final ZoneId ZONE = ZoneId.of("Europe/Dublin");

    private BjjEireCompetitionRules() {}

    /**
     * The date it is in Ireland at an instant.
     *
     * @param now the instant asked about
     * @return today in Europe/Dublin
     */
    public static LocalDate today(Instant now) {
        return now.atZone(ZONE).toLocalDate();
    }

    /**
     * Tells whether a competition is featured on the Competitions page (#3006, research R3): published, and its day has
     * not passed in Ireland.
     *
     * @param status competition status
     * @param date the competition day
     * @param now the instant asked about
     * @return true until the end of the competition day in Irish time
     */
    public static boolean isUpcoming(BjjEireCompetitionStatus status, LocalDate date, Instant now) {
        return status == BjjEireCompetitionStatus.PUBLISHED && date != null && !date.isBefore(today(now));
    }

    /**
     * Works out whether sign-ups are taken at an instant.
     *
     * @param status competition status; only a published competition takes sign-ups
     * @param opensAt start of the window, inclusive
     * @param closesAt end of the window, exclusive
     * @param competitorLimit place limit, or null for none
     * @param placesTaken places held or confirmed
     * @param now the instant asked about
     * @return closed wins over full, so a full competition reads closed once its window ends
     */
    public static RegistrationState registrationState(
            BjjEireCompetitionStatus status,
            Instant opensAt,
            Instant closesAt,
            Integer competitorLimit,
            int placesTaken,
            Instant now) {
        if (status != BjjEireCompetitionStatus.PUBLISHED || opensAt == null || closesAt == null) {
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
     * Checks what a competition needs before the public may see it.
     *
     * @param competition the competition as it would be published
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code no-divisions} or {@code invalid-window}
     */
    public static void requirePublishable(BjjEireCompetition competition) {
        if (competition.getDivisions() == null || competition.getDivisions().isEmpty()) {
            throw ApiProblems.conflict(
                    ProblemTypes.NO_DIVISIONS, "Add at least one division before publishing the competition.");
        }
        if (!isValidWindow(
                competition.getDate(), competition.getRegistrationOpensAt(), competition.getRegistrationClosesAt())) {
            throw ApiProblems.conflict(
                    ProblemTypes.INVALID_WINDOW,
                    "Registration must close after it opens and no later than the end of the competition day.");
        }
    }

    /**
     * Tells whether a registration window fits its competition day.
     *
     * @param date the competition day in Irish time
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
     * @param divisions the full division list of one competition
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
