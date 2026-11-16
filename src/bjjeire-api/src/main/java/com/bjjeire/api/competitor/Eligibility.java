package com.bjjeire.api.competitor;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.DivisionDto;
import com.bjjeire.api.bjjeirecompetition.Gender;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

/**
 * Which divisions a competitor may enter (research R13). A pure function: gender and belt must equal the division's,
 * and the age on the competition day must reach the age category's minimum. Nobody under 18 may enter (FR-017).
 */
public final class Eligibility {
    /** The youngest age, on the competition day, at which anyone may sign up. */
    public static final int MINIMUM_AGE = 18;

    private Eligibility() {}

    /**
     * Works out a competitor's age in whole years.
     *
     * @param dateOfBirth the competitor's birthday
     * @param bjjEireCompetitionDay the competition day, already an Irish date
     * @return completed years on that day
     */
    public static int ageOn(LocalDate dateOfBirth, LocalDate bjjEireCompetitionDay) {
        return Period.between(dateOfBirth, bjjEireCompetitionDay).getYears();
    }

    /**
     * Tells whether a competitor is old enough to enter at all.
     *
     * @param dateOfBirth the competitor's birthday
     * @param bjjEireCompetitionDay the competition day
     * @return true from the 18th birthday on
     */
    public static boolean isAdultOn(LocalDate dateOfBirth, LocalDate bjjEireCompetitionDay) {
        return ageOn(dateOfBirth, bjjEireCompetitionDay) >= MINIMUM_AGE;
    }

    /**
     * Tells whether a competitor may enter one division.
     *
     * @param gender the competitor's gender
     * @param belt the competitor's belt
     * @param dateOfBirth the competitor's birthday
     * @param division the division asked about
     * @param bjjEireCompetitionDay the competition day
     * @return true when gender and belt match and the age reaches the category's minimum; an older competitor may enter
     *     a younger category, never the other way round
     */
    public static boolean isEligible(
            Gender gender, Belt belt, LocalDate dateOfBirth, DivisionDto division, LocalDate bjjEireCompetitionDay) {
        if (gender == null || belt == null || dateOfBirth == null || !isAdultOn(dateOfBirth, bjjEireCompetitionDay)) {
            return false;
        }
        return division.gender() == gender
                && division.belt() == belt
                && ageOn(dateOfBirth, bjjEireCompetitionDay)
                        >= division.ageCategory().minimumAge();
    }

    /**
     * Filters a competition's divisions down to the ones a competitor may enter.
     *
     * @return the eligible divisions, in the competition's order
     */
    public static List<DivisionDto> eligibleDivisions(
            Gender gender,
            Belt belt,
            LocalDate dateOfBirth,
            List<DivisionDto> divisions,
            LocalDate bjjEireCompetitionDay) {
        return divisions.stream()
                .filter(division -> isEligible(gender, belt, dateOfBirth, division, bjjEireCompetitionDay))
                .toList();
    }
}
