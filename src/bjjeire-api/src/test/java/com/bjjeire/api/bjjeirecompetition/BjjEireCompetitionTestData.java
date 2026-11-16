package com.bjjeire.api.bjjeirecompetition;

import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.Location;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.bson.types.ObjectId;

/** BJJ Éire competition documents and command bodies shared by the competition tests. */
final class BjjEireCompetitionTestData {
    private BjjEireCompetitionTestData() {}

    static BjjEireCompetition competition(String slug, BjjEireCompetitionStatus status, LocalDate date) {
        return BjjEireCompetition.builder()
                .slug(slug)
                .name("Competition " + slug)
                .description("An in-house competition.")
                .date(date)
                .venue(new Location(
                        "1 Main Street",
                        "National Arena",
                        new GeoCoordinates("Point", List.of(-6.26, 53.35), null, null)))
                .entryFeeCents(2500)
                .currency(BjjEireCompetition.CURRENCY)
                .registrationOpensAt(Instant.parse("2026-05-01T09:00:00Z"))
                .registrationClosesAt(Instant.parse("2026-06-20T20:00:00Z"))
                .status(status)
                .divisions(new ArrayList<>(List.of(division("-76 kg"))))
                .build();
    }

    static Division division(String weightClass) {
        return Division.builder()
                .id(new ObjectId().toHexString())
                .discipline(Discipline.GI)
                .gender(Gender.MALE)
                .ageCategory(AgeCategory.ADULT)
                .belt(Belt.WHITE)
                .weightClass(weightClass)
                .build();
    }

    static String commandJson(String slug, String opensAt, String closesAt, String divisionsJson) {
        return """
            {
              "slug": "%s",
              "name": "BjjEire",
              "description": "The first in-house competition.",
              "date": "2026-06-27",
              "venue": {
                "address": "1 Main Street",
                "venue": "National Arena",
                "coordinates": { "type": "Point", "coordinates": [-6.26, 53.35] }
              },
              "entryFeeCents": 2500,
              "registrationOpensAt": "%s",
              "registrationClosesAt": "%s",
              "competitorLimit": 200,
              "divisions": %s
            }
            """.formatted(slug, opensAt, closesAt, divisionsJson);
    }

    static String divisionJson(String id, String weightClass) {
        String idPart = id == null ? "" : "\"id\": \"%s\", ".formatted(id);
        return """
            { %s"discipline": "GI", "gender": "MALE", "ageCategory": "ADULT", "belt": "WHITE", "weightClass": "%s" }
            """.formatted(idPart, weightClass);
    }
}
