package com.bjjeire.api.bjjeirecompetition;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationMetadata;
import com.bjjeire.api.web.ApiExceptionHandler;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class BjjEireCompetitionControllerTest {
    private static final String ID = "665624c1ad01ce465c6cf456";
    private static final String MISSING_ID = "665624c1ad01ce465c6cf000";

    @Mock
    private BjjEireCompetitionService bjjEireCompetitionService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new BjjEireCompetitionController(bjjEireCompetitionService),
                        new BjjEireCompetitionAdminController(bjjEireCompetitionService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void shouldReturnThePublicPageOfBjjEireCompetitions() throws Exception {
        given(bjjEireCompetitionService.getUpcoming(any(), anyString()))
                .willReturn(new PagedResponse<>(
                        List.of(summary()), new PaginationMetadata(1, 1, 20, 1, false, false, null, null)));

        mockMvc.perform(get(ApiRoutes.BJJEIRE_COMPETITION))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].slug").value("bjjeire"))
                .andExpect(jsonPath("$.data[0].status").value("PUBLISHED"))
                .andExpect(jsonPath("$.data[0].registrationState").value("OPEN"))
                .andExpect(jsonPath("$.pagination.totalItems").value(1));
    }

    @Test
    void shouldReturnNotFoundWhenNoPublicBjjEireCompetitionHasTheSlug() throws Exception {
        given(bjjEireCompetitionService.getPublishedBySlug("nope")).willReturn(Optional.empty());

        mockMvc.perform(get(ApiRoutes.BJJEIRE_COMPETITION + "/nope"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:not-found"));
    }

    @Test
    void shouldReturnCreatedWithTheDraftAndItsLocation() throws Exception {
        given(bjjEireCompetitionService.create(any())).willReturn(competition(BjjEireCompetitionStatus.DRAFT));

        mockMvc.perform(post(ApiRoutes.BJJEIRE_COMPETITION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(command("bjjeire", "\"BjjEire\"", "\"Day one\"", "2500")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", ApiRoutes.BJJEIRE_COMPETITION + "/admin/" + ID))
                .andExpect(jsonPath("$.id").value(ID))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "null | Name | NOT_NULL",
                "\"\" | Name | FIELD_REQUIRED",
            })
    void shouldRejectCreateWithoutAName(String name, String field, String ignoredCode) throws Exception {
        mockMvc.perform(post(ApiRoutes.BJJEIRE_COMPETITION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(command("bjjeire", name, "null", "2500")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:validation-error"))
                .andExpect(jsonPath("$.errors[?(@.field == '%s')]".formatted(field))
                        .exists());

        then(bjjEireCompetitionService).should(never()).create(any());
    }

    @Test
    void shouldRejectCreateWhenTheNameIsLongerThan120Characters() throws Exception {
        assertCreateRejected(command("bjjeire", "\"" + "n".repeat(121) + "\"", "null", "2500"), "Name");
        given(bjjEireCompetitionService.create(any())).willReturn(competition(BjjEireCompetitionStatus.DRAFT));
        mockMvc.perform(post(ApiRoutes.BJJEIRE_COMPETITION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(command("bjjeire", "\"" + "n".repeat(120) + "\"", "null", "2500")))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldRejectCreateWhenTheDescriptionIsLongerThan4000Characters() throws Exception {
        assertCreateRejected(command("bjjeire", "\"BjjEire\"", "\"" + "d".repeat(4001) + "\"", "2500"), "Description");
    }

    @Test
    void shouldRejectCreateWhenTheEntryFeeIsNegativeOrMissing() throws Exception {
        assertCreateRejected(command("bjjeire", "\"BjjEire\"", "null", "-1"), "EntryFeeCents");
        assertCreateRejected(command("bjjeire", "\"BjjEire\"", "null", "null"), "EntryFeeCents");
    }

    @Test
    void shouldRejectCreateWhenTheRegistrationWindowIsMissing() throws Exception {
        String withoutWindow = command("bjjeire", "\"BjjEire\"", "null", "2500")
                .replace("\"registrationOpensAt\": \"2026-06-01T09:00:00Z\",", "")
                .replace("\"registrationClosesAt\": \"2026-06-20T20:00:00Z\",", "");

        mockMvc.perform(post(ApiRoutes.BJJEIRE_COMPETITION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(withoutWindow))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'RegistrationOpensAt')]")
                        .exists())
                .andExpect(jsonPath("$.errors[?(@.field == 'RegistrationClosesAt')]")
                        .exists());
    }

    @ParameterizedTest
    @ValueSource(strings = {"admin", "BjjEire", "bjj eire", "bjj_eire", "-bjjeire", "bjjeire-", "bjj--eire", ""})
    void shouldRejectASlugThatIsReservedOrNotLowercaseLettersDigitsAndHyphens(String slug) throws Exception {
        assertCreateRejected(command(slug, "\"BjjEire\"", "null", "2500"), "Slug");
    }

    @Test
    void shouldRejectTheReservedSlugOnUpdateToo() throws Exception {
        mockMvc.perform(put(ApiRoutes.BJJEIRE_COMPETITION + "/" + ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(command("admin", "\"BjjEire\"", "null", "2500")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'Slug')]").exists());

        then(bjjEireCompetitionService).should(never()).update(anyString(), any());
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "{} | Venue.Venue | FIELD_REQUIRED",
                "{ \"venue\": \"  \" } | Venue.Venue | FIELD_REQUIRED",
                "{ \"venue\": \"%101\" } | Venue.Venue | MAX_LENGTH_EXCEEDED",
                "{ \"venue\": \"Arena\", \"address\": \"%201\" } | Venue.Address | MAX_LENGTH_EXCEEDED",
                "{ \"venue\": \"Arena\", \"coordinates\": { \"coordinates\": [-6.26] } }"
                        + " | Venue.Coordinates.Coordinates | PredicateValidator",
                "{ \"venue\": \"Arena\", \"coordinates\": { \"coordinates\": [-181, 53.35] } }"
                        + " | Venue.Coordinates.Longitude | INCLUSIVE_BETWEEN_VALUE",
                "{ \"venue\": \"Arena\", \"coordinates\": { \"coordinates\": [-6.26, 91] } }"
                        + " | Venue.Coordinates.Latitude | INCLUSIVE_BETWEEN_VALUE",
            })
    void shouldRejectAVenueWithoutANameOrWithBadCoordinates(String venueJson, String field, String code)
            throws Exception {
        String venue = venueJson.replace("%101", "v".repeat(101)).replace("%201", "a".repeat(201));
        String body = command("bjjeire", "\"BjjEire\"", "null", "2500")
                .replace("{ \"address\": \"1 Main Street\", \"venue\": \"National Arena\" }", venue);

        mockMvc.perform(post(ApiRoutes.BJJEIRE_COMPETITION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == '%s')].errorCode".formatted(field))
                        .value(code));

        then(bjjEireCompetitionService).should(never()).create(any());
    }

    @Test
    void shouldAcceptAVenueWithANameAndNoAddressOrCoordinates() throws Exception {
        given(bjjEireCompetitionService.create(any())).willReturn(competition(BjjEireCompetitionStatus.DRAFT));
        String body = command("bjjeire", "\"BjjEire\"", "null", "2500")
                .replace(
                        "{ \"address\": \"1 Main Street\", \"venue\": \"National Arena\" }",
                        "{ \"venue\": \"National Arena\" }");

        mockMvc.perform(post(ApiRoutes.BJJEIRE_COMPETITION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldRejectAnInvalidVenueOnUpdateToo() throws Exception {
        String body = command("bjjeire", "\"BjjEire\"", "null", "2500")
                .replace("{ \"address\": \"1 Main Street\", \"venue\": \"National Arena\" }", "{}");

        mockMvc.perform(put(ApiRoutes.BJJEIRE_COMPETITION + "/" + ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'Venue.Venue')]").exists());

        then(bjjEireCompetitionService).should(never()).update(anyString(), any());
    }

    @Test
    void shouldRejectADivisionWithoutAWeightClass() throws Exception {
        String body = command("bjjeire", "\"BjjEire\"", "null", "2500").replace("\"weightClass\": \"-76 kg\"", "");

        assertCreateRejected(body.replace("\"belt\": \"WHITE\",", "\"belt\": \"WHITE\""), "Divisions[0].WeightClass");
    }

    @Test
    void shouldReturnNotFoundWhenUpdatingAnUnknownBjjEireCompetition() throws Exception {
        given(bjjEireCompetitionService.update(anyString(), any())).willReturn(Optional.empty());

        mockMvc.perform(put(ApiRoutes.BJJEIRE_COMPETITION + "/" + MISSING_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(versioned(command("bjjeire", "\"BjjEire\"", "null", "2500"), 3)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:not-found"));
    }

    /** Updates replace the whole competition, so they carry the version they were edited from, as gyms do. */
    @Test
    void shouldRejectAnUpdateWithoutTheVersionItWasEditedFrom() throws Exception {
        mockMvc.perform(put(ApiRoutes.BJJEIRE_COMPETITION + "/" + ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(command("bjjeire", "\"BjjEire\"", "null", "2500")))
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.errors[?(@.field == 'Version')].errorCode").value("NOT_NULL"));

        then(bjjEireCompetitionService).should(never()).update(anyString(), any());
    }

    @Test
    void shouldReturnNotFoundWhenPublishingAnUnknownBjjEireCompetition() throws Exception {
        given(bjjEireCompetitionService.publish(MISSING_ID)).willReturn(Optional.empty());

        mockMvc.perform(post(ApiRoutes.BJJEIRE_COMPETITION + "/" + MISSING_ID + "/publish"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundWhenTheAdminOpensAnUnknownBjjEireCompetition() throws Exception {
        given(bjjEireCompetitionService.getForAdmin(MISSING_ID)).willReturn(Optional.empty());

        mockMvc.perform(get(ApiRoutes.BJJEIRE_COMPETITION + "/admin/" + MISSING_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectAnIdThatIsNotAnObjectIdWithoutCallingTheService() throws Exception {
        mockMvc.perform(post(ApiRoutes.BJJEIRE_COMPETITION + "/not-an-id/publish"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get(ApiRoutes.BJJEIRE_COMPETITION + "/admin/not-an-id")).andExpect(status().isBadRequest());

        then(bjjEireCompetitionService).should(never()).publish(anyString());
        then(bjjEireCompetitionService).should(never()).getForAdmin(anyString());
    }

    @Test
    void shouldAnswerBadRequestWhenABodyValueCannotBeRead() throws Exception {
        for (String body : new String[] {
            command("bjjeire", "\"BjjEire\"", "null", "2500").replace("\"WHITE\"", "\"PINK\""),
            command("bjjeire", "\"BjjEire\"", "null", "2500").replace("2026-06-27", "27 June"),
            "{ not json"
        }) {
            mockMvc.perform(post(ApiRoutes.BJJEIRE_COMPETITION)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.type").value("urn:bjjeire:bad-request"))
                    .andExpect(jsonPath("$.traceId").exists());
        }

        then(bjjEireCompetitionService).should(never()).create(any());
    }

    @Test
    void shouldAnswerMethodNotAllowedForAMethodTheRouteDoesNotHave() throws Exception {
        mockMvc.perform(put(ApiRoutes.BJJEIRE_COMPETITION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(command("bjjeire", "\"BjjEire\"", "null", "2500")))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:method-not-allowed"));
    }

    private static String versioned(String command, long version) {
        return command.replaceFirst("\\{", "{ \"version\": " + version + ",");
    }

    private void assertCreateRejected(String body, String field) throws Exception {
        mockMvc.perform(post(ApiRoutes.BJJEIRE_COMPETITION)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:validation-error"))
                .andExpect(jsonPath("$.errors[?(@.field == '%s')]".formatted(field))
                        .exists());
    }

    private static BjjEireCompetitionSummaryDto summary() {
        return new BjjEireCompetitionSummaryDto(
                ID,
                "bjjeire",
                "BjjEire",
                LocalDate.parse("2026-06-27"),
                new Location("1 Main Street", "National Arena", null),
                2500,
                "EUR",
                Instant.parse("2026-06-01T09:00:00Z"),
                Instant.parse("2026-06-20T20:00:00Z"),
                null,
                0,
                BjjEireCompetitionStatus.PUBLISHED,
                RegistrationState.OPEN,
                1);
    }

    private static BjjEireCompetitionDto competition(BjjEireCompetitionStatus status) {
        return new BjjEireCompetitionDto(
                ID,
                "bjjeire",
                "BjjEire",
                "Day one",
                LocalDate.parse("2026-06-27"),
                new Location("1 Main Street", "National Arena", null),
                2500,
                "EUR",
                Instant.parse("2026-06-01T09:00:00Z"),
                Instant.parse("2026-06-20T20:00:00Z"),
                null,
                0,
                status,
                RegistrationState.CLOSED,
                List.of(),
                0L);
    }

    private static String command(String slug, String nameJson, String descriptionJson, String feeJson) {
        return """
            {
              "slug": "%s",
              "name": %s,
              "description": %s,
              "date": "2026-06-27",
              "venue": { "address": "1 Main Street", "venue": "National Arena" },
              "entryFeeCents": %s,
              "registrationOpensAt": "2026-06-01T09:00:00Z",
              "registrationClosesAt": "2026-06-20T20:00:00Z",
              "competitorLimit": null,
              "divisions": [
                { "discipline": "GI", "gender": "MALE", "ageCategory": "ADULT", "belt": "WHITE", "weightClass": "-76 kg" }
              ]
            }
            """.formatted(slug, nameJson, descriptionJson, feeJson);
    }
}
