package com.bjjeire.api.competitor;

/** Request bodies for the competitor profile routes. */
final class CompetitorTestData {
    private CompetitorTestData() {}

    /** A complete profile; {@code academyJson} is a JSON value such as {@code null}. */
    static String profileJson(String firstName, String academyJson, String affiliationJson) {
        return """
            {
              "firstName": "%s",
              "middleName": "Máire",
              "lastName": "Byrne",
              "nationality": "IE",
              "dateOfBirth": "1990-04-12",
              "gender": "FEMALE",
              "belt": "BLUE",
              "academy": %s,
              "affiliation": %s,
              "phone": "+353 87 123 4567",
              "address": {
                "street": "1 Main Street",
                "postcode": "D01 X2Y3",
                "city": "Dublin",
                "region": "Dublin",
                "country": "IE"
              }
            }
            """.formatted(firstName, academyJson, affiliationJson);
    }

    static String profileJson(String firstName) {
        return profileJson(firstName, "{ \"name\": \"Team X\" }", "\"Alliance\"");
    }

    /** Only the fields a save requires: valid, but not complete enough to sign up. */
    static String minimalProfileJson() {
        return """
            { "firstName": "Aoife", "lastName": "Byrne", "dateOfBirth": "1990-04-12" }
            """;
    }
}
