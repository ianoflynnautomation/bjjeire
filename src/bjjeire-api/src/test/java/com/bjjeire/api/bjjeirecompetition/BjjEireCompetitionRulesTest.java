package com.bjjeire.api.bjjeirecompetition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bjjeire.api.web.ProblemTypes;
import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.web.server.ResponseStatusException;

class BjjEireCompetitionRulesTest {
    private static final Instant OPENS = Instant.parse("2026-06-01T09:00:00Z");
    private static final Instant CLOSES = Instant.parse("2026-06-20T20:00:00Z");
    private static final LocalDate DAY = LocalDate.parse("2026-06-27");

    @Test
    @Tag("#3006")
    void shouldCountAPublishedCompetitionAsUpcomingUntilTheEndOfItsDayInIreland() {
        // 2026-06-27 23:59 in Dublin is 22:59 UTC (Irish summer time).
        Instant lastMinute = Instant.parse("2026-06-27T22:59:00Z");
        Instant nextIrishDay = Instant.parse("2026-06-27T23:00:00Z");

        assertThat(BjjEireCompetitionRules.isUpcoming(BjjEireCompetitionStatus.PUBLISHED, DAY, lastMinute))
                .isTrue();
        assertThat(BjjEireCompetitionRules.isUpcoming(BjjEireCompetitionStatus.PUBLISHED, DAY, nextIrishDay))
                .isFalse();
        assertThat(BjjEireCompetitionRules.today(nextIrishDay)).isEqualTo(DAY.plusDays(1));
    }

    @ParameterizedTest
    @Tag("#3007")
    @EnumSource(
            value = BjjEireCompetitionStatus.class,
            names = {"DRAFT", "FINISHED", "CANCELLED"})
    void shouldNeverCountAnUnpublishedFinishedOrCancelledCompetitionAsUpcoming(BjjEireCompetitionStatus status) {
        assertThat(BjjEireCompetitionRules.isUpcoming(status, DAY, OPENS)).isFalse();
    }

    @Test
    @Tag("#5003")
    void shouldReportNotOpenBeforeRegistrationOpens() {
        assertThat(state(BjjEireCompetitionStatus.PUBLISHED, null, 0, OPENS.minusSeconds(1)))
                .isEqualTo(RegistrationState.NOT_OPEN);
    }

    @Test
    @Tag("#5003")
    void shouldReportOpenFromTheOpeningInstantUntilJustBeforeClosing() {
        assertThat(state(BjjEireCompetitionStatus.PUBLISHED, null, 0, OPENS)).isEqualTo(RegistrationState.OPEN);
        assertThat(state(BjjEireCompetitionStatus.PUBLISHED, null, 0, CLOSES.minusSeconds(1)))
                .isEqualTo(RegistrationState.OPEN);
    }

    @Test
    @Tag("#5003")
    void shouldReportClosedFromTheClosingInstant() {
        assertThat(state(BjjEireCompetitionStatus.PUBLISHED, null, 0, CLOSES)).isEqualTo(RegistrationState.CLOSED);
    }

    @Test
    void shouldReportFullWhenEveryPlaceIsTakenWhileTheWindowIsOpen() {
        assertThat(state(BjjEireCompetitionStatus.PUBLISHED, 2, 2, OPENS.plusSeconds(60)))
                .isEqualTo(RegistrationState.FULL);
        assertThat(state(BjjEireCompetitionStatus.PUBLISHED, 2, 1, OPENS.plusSeconds(60)))
                .isEqualTo(RegistrationState.OPEN);
    }

    @Test
    void shouldReportClosedRatherThanFullOnceTheWindowHasClosed() {
        assertThat(state(BjjEireCompetitionStatus.PUBLISHED, 2, 2, CLOSES.plusSeconds(60)))
                .isEqualTo(RegistrationState.CLOSED);
    }

    @ParameterizedTest
    @EnumSource(
            value = BjjEireCompetitionStatus.class,
            names = {"DRAFT", "CANCELLED", "FINISHED"})
    void shouldReportClosedForEveryStatusThatTakesNoSignUps(BjjEireCompetitionStatus status) {
        assertThat(state(status, null, 0, OPENS.plusSeconds(60))).isEqualTo(RegistrationState.CLOSED);
    }

    @Test
    void shouldAllowOnlyTheDrawnStatusTransitions() {
        assertThat(allowedFrom(BjjEireCompetitionStatus.DRAFT))
                .containsExactlyInAnyOrder(BjjEireCompetitionStatus.PUBLISHED, BjjEireCompetitionStatus.CANCELLED);
        assertThat(allowedFrom(BjjEireCompetitionStatus.PUBLISHED))
                .containsExactlyInAnyOrder(BjjEireCompetitionStatus.FINISHED, BjjEireCompetitionStatus.CANCELLED);
        assertThat(allowedFrom(BjjEireCompetitionStatus.FINISHED)).isEmpty();
        assertThat(allowedFrom(BjjEireCompetitionStatus.CANCELLED)).isEmpty();
    }

    @Test
    void shouldAcceptADraftWithADivisionAndAValidWindowForPublishing() {
        assertThatCode(() -> BjjEireCompetitionRules.requirePublishable(competition(List.of(division("-76 kg")))))
                .doesNotThrowAnyException();
    }

    @Test
    void shouldRefuseToPublishWithoutADivision() {
        assertConflict(
                () -> BjjEireCompetitionRules.requirePublishable(competition(List.of())), ProblemTypes.NO_DIVISIONS);
    }

    @Test
    void shouldRefuseToPublishWhenRegistrationClosesBeforeItOpens() {
        BjjEireCompetition competition = competition(List.of(division("-76 kg")));
        competition.setRegistrationClosesAt(OPENS);

        assertConflict(() -> BjjEireCompetitionRules.requirePublishable(competition), ProblemTypes.INVALID_WINDOW);
    }

    @Test
    void shouldRefuseToPublishWhenRegistrationClosesAfterTheEndOfTheBjjEireCompetitionDayInDublin() {
        BjjEireCompetition competition = competition(List.of(division("-76 kg")));
        // 27 June is summer time in Dublin: the day ends at 23:00 UTC.
        competition.setRegistrationClosesAt(Instant.parse("2026-06-27T23:00:00Z"));
        assertThatCode(() -> BjjEireCompetitionRules.requirePublishable(competition))
                .doesNotThrowAnyException();

        competition.setRegistrationClosesAt(Instant.parse("2026-06-27T23:00:01Z"));
        assertConflict(() -> BjjEireCompetitionRules.requirePublishable(competition), ProblemTypes.INVALID_WINDOW);
    }

    @Test
    void shouldFindADivisionRepeatedWithTheSameFiveValues() {
        Division first = division("-76 kg");
        Division repeat = division("-76 kg");
        Division other = division("-82 kg");
        Division otherBelt = division("-76 kg");
        otherBelt.setBelt(Belt.BLUE);

        assertThat(BjjEireCompetitionRules.hasDuplicateDivisions(List.of(first, other, otherBelt)))
                .isFalse();
        assertThat(BjjEireCompetitionRules.hasDuplicateDivisions(List.of(first, other, repeat)))
                .isTrue();
    }

    @Test
    void shouldTreatWeightClassLabelsThatDifferOnlyByCaseOrSpacingAsTheSameDivision() {
        assertThat(BjjEireCompetitionRules.hasDuplicateDivisions(List.of(division("-76 kg"), division(" -76 KG "))))
                .isTrue();
    }

    @Test
    void shouldGiveEachAgeCategoryItsMinimumAge() {
        assertThat(AgeCategory.ADULT.minimumAge()).isEqualTo(18);
        assertThat(AgeCategory.MASTER_1.minimumAge()).isEqualTo(30);
        assertThat(AgeCategory.MASTER_2.minimumAge()).isEqualTo(36);
        assertThat(AgeCategory.MASTER_3.minimumAge()).isEqualTo(41);
        assertThat(AgeCategory.MASTER_4.minimumAge()).isEqualTo(46);
        assertThat(AgeCategory.MASTER_5.minimumAge()).isEqualTo(51);
    }

    private static RegistrationState state(
            BjjEireCompetitionStatus status, Integer limit, int placesTaken, Instant now) {
        return BjjEireCompetitionRules.registrationState(status, OPENS, CLOSES, limit, placesTaken, now);
    }

    private static Set<BjjEireCompetitionStatus> allowedFrom(BjjEireCompetitionStatus from) {
        Set<BjjEireCompetitionStatus> allowed = EnumSet.noneOf(BjjEireCompetitionStatus.class);
        for (BjjEireCompetitionStatus target : BjjEireCompetitionStatus.values()) {
            if (from.canBecome(target)) {
                allowed.add(target);
            }
        }
        return allowed;
    }

    private static void assertConflict(Runnable action, URI type) {
        assertThatThrownBy(action::run).isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
            assertThat(exception.getStatusCode().value()).isEqualTo(409);
            assertThat(exception.getBody().getType()).isEqualTo(type);
        });
    }

    private static BjjEireCompetition competition(List<Division> divisions) {
        return BjjEireCompetition.builder()
                .slug("bjjeire")
                .name("BjjEire")
                .date(DAY)
                .entryFeeCents(2500)
                .registrationOpensAt(OPENS)
                .registrationClosesAt(CLOSES)
                .status(BjjEireCompetitionStatus.DRAFT)
                .divisions(new ArrayList<>(divisions))
                .build();
    }

    private static Division division(String weightClass) {
        return Division.builder()
                .discipline(Discipline.GI)
                .gender(Gender.MALE)
                .ageCategory(AgeCategory.ADULT)
                .belt(Belt.WHITE)
                .weightClass(weightClass)
                .build();
    }
}
