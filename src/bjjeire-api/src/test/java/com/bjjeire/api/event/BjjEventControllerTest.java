package com.bjjeire.api.event;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.County;
import com.bjjeire.api.common.GeoCoordinates;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationMetadata;
import com.bjjeire.api.common.SocialMedia;
import com.bjjeire.api.web.ApiExceptionHandler;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalTimeSerializer;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class BjjEventControllerTest {
    private static final String EVENT_ID = "665624c1ad01ce465c6cf789";
    private static final String OTHER_EVENT_ID = "665624c1ad01ce465c6cf999";
    private static final String MISSING_EVENT_ID = "665624c1ad01ce465c6cf000";

    @Mock
    private BjjEventService bjjEventService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        Jackson2ObjectMapperBuilder jacksonBuilder = new Jackson2ObjectMapperBuilder()
                .serializers(new LocalTimeSerializer(DateTimeFormatter.ofPattern("HH:mm:ss")))
                .deserializers(new LocalTimeDeserializer(DateTimeFormatter.ofPattern("HH:mm[:ss]")));

        mockMvc = MockMvcBuilders.standaloneSetup(new BjjEventController(bjjEventService))
                .setControllerAdvice(new ApiExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(jacksonBuilder.build()))
                .build();
    }

    @Test
    void shouldReturnPagedEventsWhenListingByCountyAndTypes() throws Exception {
        given(bjjEventService.getAll(any(), any(), any(), anyBoolean(), anyString()))
                .willReturn(pageOf(event(EVENT_ID)));

        mockMvc.perform(get(ApiRoutes.BJJ_EVENT).param("county", "Dublin").param("types", "OpenMat", "Camp"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(EVENT_ID))
                .andExpect(jsonPath("$.data[0].types[0]").value("Camp"))
                .andExpect(jsonPath("$.data[0].types[1]").value("OpenMat"))
                .andExpect(jsonPath("$.data[0].organiser.name").value("BJJ Eire"))
                .andExpect(jsonPath("$.data[0].pricingOptions[0].label").value("Full camp"))
                .andExpect(jsonPath("$.data[0].isActive").value(true))
                .andExpect(jsonPath("$.pagination.totalItems").value(1));
    }

    @Test
    void shouldReturnEventWithScheduleContractWhenGettingById() throws Exception {
        given(bjjEventService.getById(EVENT_ID)).willReturn(Optional.of(event(EVENT_ID)));

        mockMvc.perform(get(ApiRoutes.BJJ_EVENT + "/" + EVENT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(EVENT_ID))
                .andExpect(jsonPath("$.status").value("Upcoming"))
                .andExpect(jsonPath("$.schedule.kind").value("FixedDates"))
                .andExpect(jsonPath("$.schedule.sessions[0].startTime").value("10:00:00"))
                .andExpect(jsonPath("$.schedule.sessions[0].endTime").value("16:00:00"));
    }

    @Test
    void shouldReturnNotFoundWhenEventIsMissing() throws Exception {
        given(bjjEventService.getById(MISSING_EVENT_ID)).willReturn(Optional.empty());

        mockMvc.perform(get(ApiRoutes.BJJ_EVENT + "/" + MISSING_EVENT_ID)).andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectGetByIdWithoutCallingServiceWhenIdIsNotAnObjectId() throws Exception {
        mockMvc.perform(get(ApiRoutes.BJJ_EVENT + "/not-an-object-id"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:validation-error"))
                .andExpect(jsonPath("$.errors[0].field").value("Id"))
                .andExpect(jsonPath("$.errors[0].errorCode").value("INVALID_FORMAT"))
                .andExpect(jsonPath("$.traceId").exists());

        then(bjjEventService).should(never()).getById(anyString());
    }

    @Test
    void shouldReturnCreatedWithBodyWhenEventIsValid() throws Exception {
        given(bjjEventService.create(any())).willAnswer(invocation -> new CreateBjjEventResponse(event(EVENT_ID)));

        mockMvc.perform(post(ApiRoutes.BJJ_EVENT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventCommandJson(EVENT_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(EVENT_ID))
                .andExpect(jsonPath("$.data.name").value("Ground Game Camp"));
    }

    @Test
    void shouldReturnValidationErrorContractWhenFreePricingHasCurrency() throws Exception {
        String json = eventCommandJson(EVENT_ID).replace("\"currency\": null", "\"currency\": \"EUR\"");

        mockMvc.perform(post(ApiRoutes.BJJ_EVENT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:validation-error"))
                .andExpect(jsonPath("$.title").value("Validation Failed"))
                .andExpect(jsonPath("$.errors[0].field").value("Data.PricingOptions[0].Currency"))
                .andExpect(jsonPath("$.errors[0].message").value("Currency must be null when Pricing Type is Free."))
                .andExpect(jsonPath("$.errors[0].errorCode").value("MUST_BE_NULL"))
                .andExpect(jsonPath("$.traceId").exists());
    }

    @Test
    void shouldRejectCreateWhenTypesAreDuplicated() throws Exception {
        String json = eventCommandJson(EVENT_ID)
                .replace("\"types\": [\"Camp\", \"OpenMat\"]", "\"types\": [\"Camp\", \"Camp\"]");

        mockMvc.perform(post(ApiRoutes.BJJ_EVENT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectCreateWhenPricingScopeReferencesUnknownType() throws Exception {
        String json = eventCommandJson(EVENT_ID)
                .replace("\"appliesToTypes\": [\"OpenMat\"]", "\"appliesToTypes\": [\"Seminar\"]");

        mockMvc.perform(post(ApiRoutes.BJJ_EVENT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectCreateWhenIdIsNotAnObjectId() throws Exception {
        mockMvc.perform(post(ApiRoutes.BJJ_EVENT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventCommandJson("not-an-object-id")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectUpdateWithoutCallingServiceWhenPathAndBodyIdDiffer() throws Exception {
        mockMvc.perform(put(ApiRoutes.BJJ_EVENT + "/" + EVENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventCommandJson(OTHER_EVENT_ID)))
                .andExpect(status().isBadRequest());

        then(bjjEventService).should(never()).update(anyString(), any(UpdateBjjEventCommand.class));
    }

    @Test
    void shouldReturnNoContentWhenEventIsDeleted() throws Exception {
        given(bjjEventService.delete(EVENT_ID)).willReturn(true);

        mockMvc.perform(delete(ApiRoutes.BJJ_EVENT + "/" + EVENT_ID)).andExpect(status().isNoContent());
    }

    @Test
    void shouldReturnNotFoundWhenDeletingMissingEvent() throws Exception {
        given(bjjEventService.delete(MISSING_EVENT_ID)).willReturn(false);

        mockMvc.perform(delete(ApiRoutes.BJJ_EVENT + "/" + MISSING_EVENT_ID)).andExpect(status().isNotFound());
    }

    private static PagedResponse<BjjEventDto> pageOf(BjjEventDto dto) {
        return new PagedResponse<>(List.of(dto), new PaginationMetadata(1, 1, 20, 1, false, false, null, null));
    }

    private static BjjEventDto event(String id) {
        return new BjjEventDto(
                id,
                "Ground Game Camp",
                "Coach: Paulo Miyao",
                List.of(BjjEventType.Camp, BjjEventType.OpenMat),
                new Organizer("BJJ Eire", "https://bjjeire.com"),
                EventStatus.Upcoming,
                null,
                new SocialMedia(null, null, null, null),
                County.Clare,
                new Location(
                        "1 Main Street",
                        "Shannon Jiu-Jitsu Academy",
                        new GeoCoordinates("Point", List.of(-8.8770598, 52.716516), "Shannon", "test")),
                new BjjEventSchedule(
                        ScheduleKind.FixedDates,
                        Instant.parse("2026-07-25T00:00:00Z"),
                        Instant.parse("2026-07-27T00:00:00Z"),
                        List.of(new BjjEventSession(
                                Instant.parse("2026-07-25T00:00:00Z"),
                                null,
                                LocalTime.of(10, 0),
                                LocalTime.of(16, 0),
                                "Day 1 — Gi",
                                List.of(BjjEventType.Camp)))),
                List.of(
                        new PricingModel(PricingType.FlatRate, "Full camp", null, new BigDecimal("275"), 3, "EUR"),
                        new PricingModel(
                                PricingType.PerDay,
                                "Day pass",
                                List.of(BjjEventType.OpenMat),
                                new BigDecimal("110"),
                                null,
                                "EUR")),
                "https://groundgame.camp/",
                null,
                true);
    }

    private static String eventCommandJson(String id) {
        return """
            {
              "data": {
                "id": "%s",
                "name": "Ground Game Camp",
                "description": "Coach: Paulo Miyao",
                "types": ["Camp", "OpenMat"],
                "organiser": { "name": "BJJ Eire", "website": "https://bjjeire.com" },
                "status": "Upcoming",
                "statusReason": null,
                "socialMedia": { "instagram": null, "facebook": null, "x": null, "youTube": null },
                "county": "Clare",
                "location": {
                  "address": "1 Main Street",
                  "venue": "Shannon Jiu-Jitsu Academy",
                  "coordinates": { "type": "Point", "coordinates": [-8.8770598, 52.716516], "placeName": "Shannon", "placeId": "test" }
                },
                "schedule": {
                  "kind": "FixedDates",
                  "startDate": "2026-07-25T00:00:00Z",
                  "endDate": "2026-07-27T00:00:00Z",
                  "sessions": [
                    { "date": "2026-07-25T00:00:00Z", "day": null, "startTime": "10:00:00", "endTime": "16:00:00", "title": "Day 1", "types": ["Camp"] }
                  ]
                },
                "pricingOptions": [
                  { "type": "Free", "label": "Spectators", "appliesToTypes": null, "amount": 0, "durationDays": null, "currency": null },
                  { "type": "PerDay", "label": "Day pass", "appliesToTypes": ["OpenMat"], "amount": 110, "durationDays": null, "currency": "EUR" }
                ],
                "eventUrl": "https://groundgame.camp/",
                "imageUrl": null,
                "isActive": true
              }
            }
            """.formatted(id);
    }
}
