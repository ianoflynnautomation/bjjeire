package com.bjjeire.api.competitor;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.AgeCategory;
import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus;
import com.bjjeire.api.bjjeirecompetition.Discipline;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.DivisionResult;
import com.bjjeire.api.bjjeirecompetition.Gender;
import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.registration.BjjEireCompetitionRegistration;
import com.bjjeire.api.registration.RegistrationStatus;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** The caller's medal totals and the competitions they entered (FR-039, #5039). */
class CompetitorHistoryIT extends MongoIntegrationTest {
    private static final String HISTORY = ApiRoutes.COMPETITOR + "/me/history";
    private static final String AOIFE = competitorToken("aoife-history");
    private static final String CIARAN = competitorToken("ciaran-history");

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5039")
    void shouldTotalTheCallersMedalsAndListEachCompetitionEnteredLatestFirst() throws Exception {
        String aoife = profile(AOIFE, "Aoife");
        String ciaran = profile(CIARAN, "Ciaran");

        Division gi = division("-76 kg");
        Division noGi = division("-82 kg");
        Division empty = division("-88 kg");
        BjjEireCompetition spring = competition("spring", LocalDate.of(2026, 3, 1), gi, noGi, empty);
        String aoifeGi = registration(spring, gi, aoife, RegistrationStatus.CONFIRMED);
        String ciaranGi = registration(spring, gi, ciaran, RegistrationStatus.CONFIRMED);
        String aoifeNoGi = registration(spring, noGi, aoife, RegistrationStatus.CONFIRMED);
        String ciaranNoGi = registration(spring, noGi, ciaran, RegistrationStatus.CONFIRMED);
        result(spring, gi, aoifeGi, ciaranGi, List.of());
        result(spring, noGi, ciaranNoGi, null, List.of(aoifeNoGi));

        Division summerDivision = division("-76 kg");
        BjjEireCompetition summer = competition("summer", LocalDate.of(2026, 6, 27), summerDivision);
        registration(summer, summerDivision, aoife, RegistrationStatus.CONFIRMED);

        // Not entered: cancelled, or never paid.
        Division autumnDivision = division("-76 kg");
        BjjEireCompetition autumn = competition("autumn", LocalDate.of(2026, 9, 5), autumnDivision);
        registration(autumn, autumnDivision, aoife, RegistrationStatus.CANCELLED);
        registration(autumn, autumnDivision, aoife, RegistrationStatus.EXPIRED);

        ResponseEntity<String> response = history(AOIFE);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.at("/gold").asInt()).isEqualTo(1);
        assertThat(body.at("/silver").asInt()).isZero();
        assertThat(body.at("/bronze").asInt()).isEqualTo(1);
        assertThat(body.at("/competitions").size()).isEqualTo(2);
        assertThat(body.at("/competitions/0/slug").asString()).isEqualTo("summer");
        assertThat(body.at("/competitions/0/gold").asInt()).isZero();
        assertThat(body.at("/competitions/1/slug").asString()).isEqualTo("spring");
        assertThat(body.at("/competitions/1/name").asString()).isEqualTo("BjjEire spring");
        assertThat(body.at("/competitions/1/date").asString()).isEqualTo("2026-03-01");
        assertThat(body.at("/competitions/1/gold").asInt()).isEqualTo(1);
        assertThat(body.at("/competitions/1/bronze").asInt()).isEqualTo(1);

        JsonNode other = objectMapper.readTree(history(CIARAN).getBody());
        assertThat(other.at("/gold").asInt()).isEqualTo(1);
        assertThat(other.at("/silver").asInt()).isEqualTo(1);
        assertThat(other.at("/competitions").size()).isEqualTo(1);
    }

    @Test
    @Tag("#5039")
    void shouldBeEmptyForACompetitorWithNoProfileOrNoSignUp() throws Exception {
        JsonNode body = objectMapper.readTree(history(AOIFE).getBody());

        assertThat(body.at("/gold").asInt()).isZero();
        assertThat(body.at("/competitions").size()).isZero();
    }

    private ResponseEntity<String> history(String token) {
        return restTemplate.exchange(HISTORY, HttpMethod.GET, jsonEntity(null, token), String.class);
    }

    private String profile(String token, String name) {
        ResponseEntity<String> saved = restTemplate.exchange(
                ApiRoutes.COMPETITOR + "/me",
                HttpMethod.PUT,
                jsonEntity(CompetitorTestData.profileJson(name), token),
                String.class);
        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.OK);
        String subject = token.substring(COMPETITOR_TOKEN_AS.length());
        return mongoTemplate
                .findOne(Query.query(Criteria.where("subject").is(subject)), Competitor.class)
                .getId();
    }

    private static Division division(String weight) {
        return Division.builder()
                .id(new ObjectId().toHexString())
                .discipline(Discipline.GI)
                .gender(Gender.FEMALE)
                .ageCategory(AgeCategory.ADULT)
                .belt(Belt.BLUE)
                .weightClass(weight)
                .build();
    }

    private BjjEireCompetition competition(String slug, LocalDate date, Division... divisions) {
        return mongoTemplate.insert(BjjEireCompetition.builder()
                .slug(slug)
                .name("BjjEire " + slug)
                .date(date)
                .status(BjjEireCompetitionStatus.PUBLISHED)
                .version(0L)
                .divisions(new ArrayList<>(List.of(divisions)))
                .build());
    }

    private String registration(
            BjjEireCompetition competition, Division division, String competitorId, RegistrationStatus status) {
        return mongoTemplate
                .insert(BjjEireCompetitionRegistration.builder()
                        .id(new ObjectId().toHexString())
                        .competitionId(competition.getId())
                        .divisionId(division.getId())
                        .competitorId(competitorId)
                        .status(status)
                        .active(status.activeFlag())
                        .displayName("Someone Byrne")
                        .createdOnUtc(FIXED_NOW)
                        .build())
                .getId();
    }

    private void result(
            BjjEireCompetition competition, Division division, String gold, String silver, List<String> bronzes) {
        BjjEireCompetition stored = mongoTemplate.findById(competition.getId(), BjjEireCompetition.class);
        for (Division candidate : stored.getDivisions()) {
            if (candidate.getId().equals(division.getId())) {
                candidate.setResult(DivisionResult.builder()
                        .goldRegistrationId(gold)
                        .silverRegistrationId(silver)
                        .bronzeRegistrationIds(new ArrayList<>(bronzes))
                        .recordedAt(FIXED_NOW)
                        .recordedBy("organiser")
                        .build());
            }
        }
        mongoTemplate.save(stored);
    }
}
