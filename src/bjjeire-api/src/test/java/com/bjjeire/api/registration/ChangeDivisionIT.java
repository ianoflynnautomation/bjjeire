package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.AgeCategory;
import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.Discipline;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.ObjectMapper;

/** A competitor moves their confirmed sign-up to another division (FR-028). */
class ChangeDivisionIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5024")
    void shouldMoveTheSignUpToAnEligibleDivisionWithoutChargingOrTakingAnotherPlace() {
        Division light = maleWhiteAdult("-76 kg");
        Division heavy = maleWhiteAdult("-82 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("move-open", 10, light, heavy);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, light);
        int checkouts = paymentGateway.checkouts().size();

        ResponseEntity<String> response = changeDivision(AOIFE, confirmed.getId(), heavy.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(response.getBody()).at("/division/id").asString())
                .isEqualTo(heavy.getId());
        BjjEireCompetitionRegistration moved = reload(confirmed);
        assertThat(moved.getDivisionId()).isEqualTo(heavy.getId());
        assertThat(moved.getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
        assertThat(moved.getPayment().getAmountCents()).isEqualTo(2500);
        assertThat(paymentGateway.checkouts()).hasSize(checkouts);
        assertThat(paymentGateway.refunds()).isEmpty();
        assertThat(placesTaken(competition.getId())).isEqualTo(1);
        String listed = restTemplate
                .getForEntity("/api/v1/bjjeire-competition/" + competition.getId() + "/competitor", String.class)
                .getBody();
        assertThat(objectMapper.readTree(listed).at("/0/competitors").size()).isZero();
        assertThat(objectMapper
                        .readTree(listed)
                        .at("/1/competitors/0/displayName")
                        .asString())
                .isEqualTo("Aoife Byrne");
    }

    @Test
    @Tag("#5025")
    void shouldRefuseToChangeDivisionOnceRegistrationHasClosed() {
        Division light = maleWhiteAdult("-76 kg");
        Division heavy = maleWhiteAdult("-82 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("move-closed", null, light, heavy);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, light);
        closeRegistration(competition.getId());

        ResponseEntity<String> response = changeDivision(AOIFE, confirmed.getId(), heavy.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(objectMapper.readTree(response.getBody()).at("/type").asString())
                .isEqualTo("urn:bjjeire:registration-closed");
        assertThat(objectMapper.readTree(response.getBody()).at("/detail").asString())
                .contains("contact the organiser");
        assertThat(reload(confirmed).getDivisionId()).isEqualTo(light.getId());
    }

    @Test
    @Tag("#5024")
    void shouldRefuseADivisionTheCompetitorIsNotEligibleFor() {
        Division light = maleWhiteAdult("-76 kg");
        Division blue = Division.builder()
                .id(new ObjectId().toHexString())
                .discipline(Discipline.GI)
                .gender(Gender.MALE)
                .ageCategory(AgeCategory.ADULT)
                .belt(Belt.BLUE)
                .weightClass("-76 kg")
                .build();
        BjjEireCompetition competition = publishedBjjEireCompetition("move-ineligible", null, light, blue);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, light);

        ResponseEntity<String> response = changeDivision(AOIFE, confirmed.getId(), blue.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(objectMapper.readTree(response.getBody()).at("/type").asString())
                .isEqualTo("urn:bjjeire:not-eligible");
        assertThat(reload(confirmed).getDivisionId()).isEqualTo(light.getId());
    }

    @Test
    @Tag("#5024")
    void shouldRefuseADivisionTheCompetitorAlreadyHolds() {
        Division gi = maleWhiteAdult("-76 kg");
        Division noGi = division(Discipline.NO_GI, Gender.MALE, AgeCategory.ADULT, Belt.WHITE, "-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("move-held", null, gi, noGi);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration giEntry = confirmedSignUp(AOIFE, competition, gi);
        confirmedSignUp(AOIFE, competition, noGi);

        ResponseEntity<String> response = changeDivision(AOIFE, giEntry.getId(), noGi.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(objectMapper.readTree(response.getBody()).at("/type").asString())
                .isEqualTo("urn:bjjeire:already-registered");
        assertThat(reload(giEntry).getDivisionId()).isEqualTo(gi.getId());
    }

    @Test
    void shouldRefuseADivisionTheBjjEireCompetitionDoesNotHaveAndAnotherCompetitorsSignUp() {
        Division light = maleWhiteAdult("-76 kg");
        Division heavy = maleWhiteAdult("-82 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("move-unknown", null, light, heavy);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(AOIFE, competition, light);

        ResponseEntity<String> unknown = changeDivision(AOIFE, confirmed.getId(), new ObjectId().toHexString());
        ResponseEntity<String> notTheirs = changeDivision(CIARAN, confirmed.getId(), heavy.getId());

        assertThat(unknown.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(notTheirs.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(reload(confirmed).getDivisionId()).isEqualTo(light.getId());
    }

    @Test
    void shouldRefuseToMoveAnUnpaidSignUp() {
        Division light = maleWhiteAdult("-76 kg");
        Division heavy = maleWhiteAdult("-82 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("move-unpaid", null, light, heavy);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), light.getId());

        ResponseEntity<String> response =
                changeDivision(AOIFE, onlyRegistration().getId(), heavy.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(onlyRegistration().getDivisionId()).isEqualTo(light.getId());
    }
}
