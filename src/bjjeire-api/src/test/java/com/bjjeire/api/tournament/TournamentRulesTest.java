package com.bjjeire.api.tournament;

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

class TournamentRulesTest {
    private static final Instant OPENS = Instant.parse("2026-06-01T09:00:00Z");
    private static final Instant CLOSES = Instant.parse("2026-06-20T20:00:00Z");
    private static final LocalDate DAY = LocalDate.parse("2026-06-27");

    @Test
    @Tag("#5003")
    void shouldReportNotOpenBeforeRegistrationOpens() {
        assertThat(state(TournamentStatus.PUBLISHED, null, 0, OPENS.minusSeconds(1)))
                .isEqualTo(RegistrationState.NOT_OPEN);
    }

    @Test
    @Tag("#5003")
    void shouldReportOpenFromTheOpeningInstantUntilJustBeforeClosing() {
        assertThat(state(TournamentStatus.PUBLISHED, null, 0, OPENS)).isEqualTo(RegistrationState.OPEN);
        assertThat(state(TournamentStatus.PUBLISHED, null, 0, CLOSES.minusSeconds(1)))
                .isEqualTo(RegistrationState.OPEN);
    }

    @Test
    @Tag("#5003")
    void shouldReportClosedFromTheClosingInstant() {
        assertThat(state(TournamentStatus.PUBLISHED, null, 0, CLOSES)).isEqualTo(RegistrationState.CLOSED);
    }

    @Test
    void shouldReportFullWhenEveryPlaceIsTakenWhileTheWindowIsOpen() {
        assertThat(state(TournamentStatus.PUBLISHED, 2, 2, OPENS.plusSeconds(60)))
                .isEqualTo(RegistrationState.FULL);
        assertThat(state(TournamentStatus.PUBLISHED, 2, 1, OPENS.plusSeconds(60)))
                .isEqualTo(RegistrationState.OPEN);
    }

    @Test
    void shouldReportClosedRatherThanFullOnceTheWindowHasClosed() {
        assertThat(state(TournamentStatus.PUBLISHED, 2, 2, CLOSES.plusSeconds(60)))
                .isEqualTo(RegistrationState.CLOSED);
    }

    @ParameterizedTest
    @EnumSource(
            value = TournamentStatus.class,
            names = {"DRAFT", "CANCELLED", "FINISHED"})
    void shouldReportClosedForEveryStatusThatTakesNoSignUps(TournamentStatus status) {
        assertThat(state(status, null, 0, OPENS.plusSeconds(60))).isEqualTo(RegistrationState.CLOSED);
    }

    @Test
    void shouldAllowOnlyTheDrawnStatusTransitions() {
        assertThat(allowedFrom(TournamentStatus.DRAFT))
                .containsExactlyInAnyOrder(TournamentStatus.PUBLISHED, TournamentStatus.CANCELLED);
        assertThat(allowedFrom(TournamentStatus.PUBLISHED))
                .containsExactlyInAnyOrder(TournamentStatus.FINISHED, TournamentStatus.CANCELLED);
        assertThat(allowedFrom(TournamentStatus.FINISHED)).isEmpty();
        assertThat(allowedFrom(TournamentStatus.CANCELLED)).isEmpty();
    }

    @Test
    void shouldAcceptADraftWithADivisionAndAValidWindowForPublishing() {
        assertThatCode(() -> TournamentRules.requirePublishable(tournament(List.of(division("-76 kg")))))
                .doesNotThrowAnyException();
    }

    @Test
    void shouldRefuseToPublishWithoutADivision() {
        assertConflict(() -> TournamentRules.requirePublishable(tournament(List.of())), ProblemTypes.NO_DIVISIONS);
    }

    @Test
    void shouldRefuseToPublishWhenRegistrationClosesBeforeItOpens() {
        Tournament tournament = tournament(List.of(division("-76 kg")));
        tournament.setRegistrationClosesAt(OPENS);

        assertConflict(() -> TournamentRules.requirePublishable(tournament), ProblemTypes.INVALID_WINDOW);
    }

    @Test
    void shouldRefuseToPublishWhenRegistrationClosesAfterTheEndOfTheTournamentDayInDublin() {
        Tournament tournament = tournament(List.of(division("-76 kg")));
        // 27 June is summer time in Dublin: the day ends at 23:00 UTC.
        tournament.setRegistrationClosesAt(Instant.parse("2026-06-27T23:00:00Z"));
        assertThatCode(() -> TournamentRules.requirePublishable(tournament)).doesNotThrowAnyException();

        tournament.setRegistrationClosesAt(Instant.parse("2026-06-27T23:00:01Z"));
        assertConflict(() -> TournamentRules.requirePublishable(tournament), ProblemTypes.INVALID_WINDOW);
    }

    @Test
    void shouldFindADivisionRepeatedWithTheSameFiveValues() {
        Division first = division("-76 kg");
        Division repeat = division("-76 kg");
        Division other = division("-82 kg");
        Division otherBelt = division("-76 kg");
        otherBelt.setBelt(Belt.BLUE);

        assertThat(TournamentRules.hasDuplicateDivisions(List.of(first, other, otherBelt)))
                .isFalse();
        assertThat(TournamentRules.hasDuplicateDivisions(List.of(first, other, repeat)))
                .isTrue();
    }

    @Test
    void shouldTreatWeightClassLabelsThatDifferOnlyByCaseOrSpacingAsTheSameDivision() {
        assertThat(TournamentRules.hasDuplicateDivisions(List.of(division("-76 kg"), division(" -76 KG "))))
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

    private static RegistrationState state(TournamentStatus status, Integer limit, int placesTaken, Instant now) {
        return TournamentRules.registrationState(status, OPENS, CLOSES, limit, placesTaken, now);
    }

    private static Set<TournamentStatus> allowedFrom(TournamentStatus from) {
        Set<TournamentStatus> allowed = EnumSet.noneOf(TournamentStatus.class);
        for (TournamentStatus target : TournamentStatus.values()) {
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

    private static Tournament tournament(List<Division> divisions) {
        return Tournament.builder()
                .slug("bjjeire")
                .name("BjjEire")
                .date(DAY)
                .entryFeeCents(2500)
                .registrationOpensAt(OPENS)
                .registrationClosesAt(CLOSES)
                .status(TournamentStatus.DRAFT)
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
