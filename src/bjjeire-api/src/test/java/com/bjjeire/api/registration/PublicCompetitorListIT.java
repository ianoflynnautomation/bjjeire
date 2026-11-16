package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Division;
import com.bjjeire.api.tournament.Gender;
import com.bjjeire.api.tournament.Tournament;
import com.bjjeire.api.tournament.TournamentStatus;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** The public competitor list: confirmed sign-ups only, and no private field (#5015, FR-011). */
class PublicCompetitorListIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");
    private static final String NIAMH = competitorToken("niamh");

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5015")
    void shouldListConfirmedCompetitorsByDivisionWithNameAcademyAndAffiliation() throws Exception {
        Division lightweight = maleWhiteAdult("-70 kg");
        Division middleweight = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("listed", null, lightweight, middleweight);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE, "null", "null");
        saveProfile(NIAMH, "Niamh", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        confirm(signUpAndFind(AOIFE, tournament, lightweight));
        confirm(signUpAndFind(CIARAN, tournament, lightweight));
        // Awaiting payment: not listed.
        signUp(NIAMH, tournament.getId(), middleweight.getId());

        ResponseEntity<String> response = list(tournament.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.size()).isEqualTo(2);
        assertThat(body.at("/0/divisionId").asString()).isEqualTo(lightweight.getId());
        assertThat(body.at("/0/competitors").size()).isEqualTo(2);
        assertThat(body.at("/0/competitors/0/displayName").asString()).isEqualTo("Aoife Byrne");
        assertThat(body.at("/0/competitors/0/academy").asString()).isEqualTo("Team X");
        assertThat(body.at("/0/competitors/0/affiliation").asString()).isEqualTo("Alliance");
        assertThat(body.at("/0/competitors/1/displayName").asString()).isEqualTo("Ciaran Byrne");
        assertThat(body.at("/0/competitors/1").has("academy")).isFalse();
        assertThat(body.at("/1/divisionId").asString()).isEqualTo(middleweight.getId());
        assertThat(body.at("/1/competitors").size()).isZero();
    }

    @Test
    @Tag("#5015")
    void shouldCarryNoPrivateFieldInThePublicJson() {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("private", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        confirm(signUpAndFind(AOIFE, tournament, division));

        String json = list(tournament.getId()).getBody();

        assertThat(json).contains("Aoife Byrne");
        for (String field : List.of(
                "email",
                "dateOfBirth",
                "phone",
                "address",
                "nationality",
                "competitorId",
                "payment",
                "checkout",
                "registrationId")) {
            assertThat(json).doesNotContainIgnoringCase(field);
        }
        assertThat(json).doesNotContain(competitorEmail("aoife")).doesNotContain("1990-04-12");
    }

    @Test
    @Tag("#5015")
    void shouldShowANewlyConfirmedCompetitorStraightAway() throws Exception {
        Division division = maleWhiteAdult("-76 kg");
        Tournament tournament = publishedTournament("fresh", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        TournamentRegistration registration = signUpAndFind(AOIFE, tournament, division);
        assertThat(objectMapper
                        .readTree(list(tournament.getId()).getBody())
                        .at("/0/competitors")
                        .size())
                .isZero();

        postSignedWebhook(checkoutEvent("evt_fresh", "checkout.session.completed", registration));

        assertThat(objectMapper
                        .readTree(list(tournament.getId()).getBody())
                        .at("/0/competitors")
                        .size())
                .isEqualTo(1);
    }

    @Test
    void shouldNotListADraftOrAnUnknownTournament() {
        Tournament draft = insertTournament(
                "draft-list", TournamentStatus.DRAFT, OPENS_AT, CLOSES_AT, null, maleWhiteAdult("-76 kg"));

        assertThat(list(draft.getId()).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(list("665f1c2b9b1e8a0012345678").getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private TournamentRegistration signUpAndFind(String token, Tournament tournament, Division division) {
        signUp(token, tournament.getId(), division.getId());
        return mongoTemplate.findAll(TournamentRegistration.class).stream()
                .filter(registration -> registration.getDivisionId().equals(division.getId()))
                .reduce((first, second) -> second)
                .orElseThrow();
    }

    private void confirm(TournamentRegistration registration) {
        postSignedWebhook(checkoutEvent("evt_" + registration.getId(), "checkout.session.completed", registration));
    }

    private ResponseEntity<String> list(String tournamentId) {
        return restTemplate.exchange(
                ApiRoutes.TOURNAMENT + "/" + tournamentId + "/competitor",
                HttpMethod.GET,
                jsonEntity(null, null),
                String.class);
    }
}
