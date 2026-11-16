package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Division;
import com.bjjeire.api.tournament.Gender;
import com.bjjeire.api.tournament.Tournament;
import com.bjjeire.api.tournament.TournamentStatus;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

/**
 * A profile edit reaches the competitor's sign-ups in tournaments still running (research R8, spec edge case on belt or
 * gender changes). Lives with the sign-ups it changes; driven through the profile route.
 */
class ProfilePropagationIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");

    @Test
    void shouldCopyANewNameAcademyAndAffiliationToActiveSignUps() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("propagate", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, tournament.getId(), division.getId());

        saveProfile(
                AOIFE,
                "Aoibhe",
                Gender.MALE,
                Belt.WHITE,
                ADULT_BIRTH_DATE,
                "{ \"name\": \"  New   Gym \" }",
                "\"Checkmat\"");

        TournamentRegistration updated = onlyRegistration();
        assertThat(updated.getDisplayName()).isEqualTo("Aoibhe Byrne");
        assertThat(updated.getAcademy().name()).isEqualTo("New   Gym");
        assertThat(updated.getAcademyKey()).isEqualTo("name:new gym");
        assertThat(updated.getAffiliation()).isEqualTo("Checkmat");
        assertThat(updated.getAffiliationKey()).isEqualTo("checkmat");
        assertThat(updated.isProfileMismatch()).isFalse();
    }

    @Test
    void shouldLeaveSignUpsInFinishedTournamentsAlone() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("finished", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, tournament.getId(), division.getId());
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(tournament.getId())),
                Update.update("status", TournamentStatus.FINISHED),
                Tournament.class);

        saveProfile(AOIFE, "Aoibhe", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE, "null", "null");

        TournamentRegistration untouched = onlyRegistration();
        assertThat(untouched.getDisplayName()).isEqualTo("Aoife Byrne");
        assertThat(untouched.getAcademy().name()).isEqualTo("Team X");
        assertThat(untouched.getAffiliation()).isEqualTo("Alliance");
    }

    @Test
    void shouldKeepTheDivisionButFlagAMismatchWhenBeltOrGenderChanges() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("mismatch", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, tournament.getId(), division.getId());

        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.BLUE, ADULT_BIRTH_DATE);

        TournamentRegistration flagged = onlyRegistration();
        assertThat(flagged.getDivisionId()).isEqualTo(division.getId());
        assertThat(flagged.isProfileMismatch()).isTrue();

        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        assertThat(onlyRegistration().isProfileMismatch()).isFalse();
    }
}
