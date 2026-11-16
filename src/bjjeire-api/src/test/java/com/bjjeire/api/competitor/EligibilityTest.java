package com.bjjeire.api.competitor;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.AgeCategory;
import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.Discipline;
import com.bjjeire.api.bjjeirecompetition.DivisionDto;
import com.bjjeire.api.bjjeirecompetition.Gender;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/** The division eligibility rule (research R13, FR-016, FR-017). */
class EligibilityTest {
    private static final LocalDate COMPETITION_DAY = LocalDate.of(2026, 6, 27);

    @Test
    @Tag("#5014")
    void shouldOfferAFortyYearOldTheAdultMasterOneAndMasterTwoCategoriesButNotMasterThree() {
        LocalDate fortyOnTheDay = COMPETITION_DAY.minusYears(40);
        List<DivisionDto> divisions = Arrays.stream(AgeCategory.values())
                .map(category -> division(Gender.MALE, Belt.BLUE, category))
                .toList();

        List<AgeCategory> offered =
                Eligibility.eligibleDivisions(Gender.MALE, Belt.BLUE, fortyOnTheDay, divisions, COMPETITION_DAY)
                        .stream()
                        .map(DivisionDto::ageCategory)
                        .toList();

        assertThat(offered).containsExactly(AgeCategory.ADULT, AgeCategory.MASTER_1, AgeCategory.MASTER_2);
    }

    @Test
    @Tag("#5014")
    void shouldOfferOnlyDivisionsOfTheCompetitorsGenderAndBelt() {
        LocalDate dateOfBirth = LocalDate.of(1990, 4, 12);
        DivisionDto matching = division(Gender.FEMALE, Belt.PURPLE, AgeCategory.ADULT);
        List<DivisionDto> divisions = List.of(
                matching,
                division(Gender.MALE, Belt.PURPLE, AgeCategory.ADULT),
                division(Gender.FEMALE, Belt.BLUE, AgeCategory.ADULT),
                division(Gender.FEMALE, Belt.BROWN, AgeCategory.ADULT));

        assertThat(Eligibility.eligibleDivisions(Gender.FEMALE, Belt.PURPLE, dateOfBirth, divisions, COMPETITION_DAY))
                .containsExactly(matching);
    }

    @Test
    @Tag("#5014")
    void shouldCountAnAgeCategoryFromItsMinimumBirthdayOnTheBjjEireCompetitionDay() {
        DivisionDto masterOne = division(Gender.MALE, Belt.WHITE, AgeCategory.MASTER_1);

        assertThat(Eligibility.isEligible(
                        Gender.MALE, Belt.WHITE, COMPETITION_DAY.minusYears(30), masterOne, COMPETITION_DAY))
                .isTrue();
        assertThat(Eligibility.isEligible(
                        Gender.MALE,
                        Belt.WHITE,
                        COMPETITION_DAY.minusYears(30).plusDays(1),
                        masterOne,
                        COMPETITION_DAY))
                .isFalse();
    }

    @Test
    @Tag("#5019")
    void shouldRefuseSomeoneWhoseEighteenthBirthdayIsTheDayAfterTheBjjEireCompetition() {
        LocalDate eighteenTomorrow = COMPETITION_DAY.minusYears(18).plusDays(1);
        DivisionDto adult = division(Gender.MALE, Belt.WHITE, AgeCategory.ADULT);

        assertThat(Eligibility.isAdultOn(eighteenTomorrow, COMPETITION_DAY)).isFalse();
        assertThat(Eligibility.isEligible(Gender.MALE, Belt.WHITE, eighteenTomorrow, adult, COMPETITION_DAY))
                .isFalse();
        assertThat(Eligibility.eligibleDivisions(
                        Gender.MALE, Belt.WHITE, eighteenTomorrow, List.of(adult), COMPETITION_DAY))
                .isEmpty();
    }

    @Test
    @Tag("#5019")
    void shouldAcceptSomeoneWhoTurnsEighteenOnTheBjjEireCompetitionDay() {
        assertThat(Eligibility.isAdultOn(COMPETITION_DAY.minusYears(18), COMPETITION_DAY))
                .isTrue();
    }

    @Test
    @Tag("#5019")
    void shouldRefuseAnyoneUnderEighteenForEveryDivision() {
        LocalDate sixteen = COMPETITION_DAY.minusYears(16);
        List<DivisionDto> divisions = Arrays.stream(AgeCategory.values())
                .map(category -> division(Gender.FEMALE, Belt.WHITE, category))
                .toList();

        assertThat(Eligibility.eligibleDivisions(Gender.FEMALE, Belt.WHITE, sixteen, divisions, COMPETITION_DAY))
                .isEmpty();
    }

    private static DivisionDto division(Gender gender, Belt belt, AgeCategory category) {
        return new DivisionDto(null, Discipline.GI, gender, category, belt, "-76 kg");
    }
}
