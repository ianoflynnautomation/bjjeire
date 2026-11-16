package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

/**
 * A profile edit reaches the competitor's sign-ups in competitions still running (research R8, spec edge case on belt
 * or gender changes). Lives with the sign-ups it changes; driven through the profile route.
 */
class ProfilePropagationIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");

    @Test
    void shouldCopyANewNameAcademyAndAffiliationToActiveSignUps() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("propagate", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());

        saveProfile(
                AOIFE,
                "Aoibhe",
                Gender.MALE,
                Belt.WHITE,
                ADULT_BIRTH_DATE,
                "{ \"name\": \"  New   Gym \" }",
                "\"Checkmat\"");

        BjjEireCompetitionRegistration updated = onlyRegistration();
        assertThat(updated.getDisplayName()).isEqualTo("Aoibhe Byrne");
        assertThat(updated.getAcademy().name()).isEqualTo("New   Gym");
        assertThat(updated.getAcademyKey()).isEqualTo("name:new gym");
        assertThat(updated.getAffiliation()).isEqualTo("Checkmat");
        assertThat(updated.getAffiliationKey()).isEqualTo("checkmat");
        assertThat(updated.isProfileMismatch()).isFalse();
    }

    @Test
    void shouldLeaveSignUpsInFinishedBjjEireCompetitionsAlone() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("finished", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(competition.getId())),
                Update.update("status", BjjEireCompetitionStatus.FINISHED),
                BjjEireCompetition.class);

        saveProfile(AOIFE, "Aoibhe", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE, "null", "null");

        BjjEireCompetitionRegistration untouched = onlyRegistration();
        assertThat(untouched.getDisplayName()).isEqualTo("Aoife Byrne");
        assertThat(untouched.getAcademy().name()).isEqualTo("Team X");
        assertThat(untouched.getAffiliation()).isEqualTo("Alliance");
    }

    @Test
    void shouldKeepTheDivisionButFlagAMismatchWhenBeltOrGenderChanges() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("mismatch", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());

        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.BLUE, ADULT_BIRTH_DATE);

        BjjEireCompetitionRegistration flagged = onlyRegistration();
        assertThat(flagged.getDivisionId()).isEqualTo(division.getId());
        assertThat(flagged.isProfileMismatch()).isTrue();

        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        assertThat(onlyRegistration().isProfileMismatch()).isFalse();
    }
}
