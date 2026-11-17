package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import com.bjjeire.api.common.ApiRoutes;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** A sign-up named in a result can no longer be cancelled or moved (FR-026, data-model.md). */
class ResultRecordedIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife-medal");
    private static final String CIARAN = competitorToken("ciaran-medal");
    private static final String ADMIN = "integration-test-token";

    @Test
    @Tag("#5028")
    void shouldRefuseTheMedallistsOwnCancellationAndDivisionChange() {
        Division division = maleWhiteAdult("-76 kg");
        Division other = maleWhiteAdult("-82 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("medal-guard", null, division, other);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration medallist = confirmedSignUp(AOIFE, competition, division);
        assertThat(recordGold(competition, division, medallist).getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<String> cancelled = cancel(AOIFE, medallist.getId());
        ResponseEntity<String> moved = changeDivision(AOIFE, medallist.getId(), other.getId());

        assertThat(cancelled.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(cancelled.getBody()).contains("urn:bjjeire:result-recorded");
        assertThat(moved.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(moved.getBody()).contains("urn:bjjeire:result-recorded");
        BjjEireCompetitionRegistration after = reload(medallist);
        assertThat(after.getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
        assertThat(after.getDivisionId()).isEqualTo(division.getId());
        assertThat(paymentGateway.refunds()).isEmpty();
    }

    @Test
    @Tag("#5028")
    void shouldRefuseTheOrganisersMoveAndCancelOfAMedallist() {
        Division division = maleWhiteAdult("-76 kg");
        Division other = maleWhiteAdult("-82 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("medal-admin", null, division, other);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration medallist = confirmedSignUp(AOIFE, competition, division);
        recordGold(competition, division, medallist);

        ResponseEntity<String> moved = restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competition.getId() + "/registration/" + medallist.getId()
                        + "/division",
                HttpMethod.PUT,
                jsonEntity("{ \"divisionId\": \"" + other.getId() + "\" }", ADMIN),
                String.class);
        ResponseEntity<String> cancelled = restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competition.getId() + "/registration/" + medallist.getId()
                        + "/cancel",
                HttpMethod.POST,
                jsonEntity("{ \"refund\": true }", ADMIN),
                String.class);

        assertThat(moved.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(moved.getBody()).contains("urn:bjjeire:result-recorded");
        assertThat(cancelled.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(cancelled.getBody()).contains("urn:bjjeire:result-recorded");
        assertThat(reload(medallist).getStatus()).isEqualTo(RegistrationStatus.CONFIRMED);
    }

    @Test
    @Tag("#5033")
    void shouldAllowCancellingOnceTheResultNoLongerNamesTheSignUp() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("medal-cleared", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration aoife = confirmedSignUp(AOIFE, competition, division);
        BjjEireCompetitionRegistration ciaran = confirmedSignUp(CIARAN, competition, division);
        recordGold(competition, division, aoife);
        recordGold(competition, division, ciaran);

        assertThat(cancel(AOIFE, aoife.getId()).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(cancel(CIARAN, ciaran.getId()).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    private ResponseEntity<String> recordGold(
            BjjEireCompetition competition, Division division, BjjEireCompetitionRegistration gold) {
        return restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competition.getId() + "/division/" + division.getId() + "/result",
                HttpMethod.PUT,
                jsonEntity(
                        "{ \"goldRegistrationId\": \"" + gold.getId() + "\", \"bronzeRegistrationIds\": [] }", ADMIN),
                String.class);
    }
}
