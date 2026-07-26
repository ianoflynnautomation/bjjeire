package com.bjjeire.api.gym;

import static org.mockito.ArgumentMatchers.any;
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
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationMetadata;
import com.bjjeire.api.web.ApiExceptionHandler;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class GymControllerTest {
    private static final String GYM_ID = "665624c1ad01ce465c6cf456";
    private static final String OTHER_GYM_ID = "665624c1ad01ce465c6cf999";
    private static final String MISSING_GYM_ID = "665624c1ad01ce465c6cf000";

    @Mock
    private GymService gymService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new GymController(gymService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void shouldReturnPagedGymsWhenListingByCounty() throws Exception {
        given(gymService.getAll(any(), any(), anyString())).willReturn(pageOf(gym(GYM_ID)));

        mockMvc.perform(get(ApiRoutes.GYM).param("county", "Dublin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(GYM_ID))
                .andExpect(jsonPath("$.data[0].status").value("Active"))
                .andExpect(jsonPath("$.data[0].county").value("Dublin"))
                .andExpect(jsonPath("$.pagination.totalItems").value(1));
    }

    @Test
    void shouldRejectListingWhenCountyIsUnknown() throws Exception {
        mockMvc.perform(get(ApiRoutes.GYM).param("county", "Invalid")).andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnNotFoundWhenGymIsMissing() throws Exception {
        given(gymService.getById(MISSING_GYM_ID)).willReturn(Optional.empty());

        mockMvc.perform(get(ApiRoutes.GYM + "/" + MISSING_GYM_ID)).andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectGetByIdWithoutCallingServiceWhenIdIsNotAnObjectId() throws Exception {
        mockMvc.perform(get(ApiRoutes.GYM + "/not-an-object-id"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:validation-error"))
                .andExpect(jsonPath("$.errors[0].field").value("Id"))
                .andExpect(jsonPath("$.errors[0].errorCode").value("INVALID_FORMAT"))
                .andExpect(jsonPath("$.traceId").exists());

        then(gymService).should(never()).getById(anyString());
    }

    @Test
    void shouldRejectDeleteWithoutCallingServiceWhenIdIsNotAnObjectId() throws Exception {
        mockMvc.perform(delete(ApiRoutes.GYM + "/not-an-object-id")).andExpect(status().isBadRequest());

        then(gymService).should(never()).delete(anyString());
    }

    @Test
    void shouldRejectListingWhenPageIsBelowMinimum() throws Exception {
        mockMvc.perform(get(ApiRoutes.GYM).param("page", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:validation-error"))
                .andExpect(jsonPath("$.errors[0].field").value("Page"))
                .andExpect(jsonPath("$.errors[0].errorCode").value("VALUE_OUT_OF_RANGE"));

        then(gymService).should(never()).getAll(any(), any(), anyString());
    }

    @Test
    void shouldReturnCreatedWithBodyWhenGymIsValid() throws Exception {
        given(gymService.create(any())).willReturn(new CreateGymResponse(gym(GYM_ID)));

        mockMvc.perform(post(ApiRoutes.GYM)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gymCommandJson(GYM_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(GYM_ID))
                .andExpect(jsonPath("$.data.name").value("BJJ Dublin"));
    }

    @Test
    void shouldRejectUpdateWithoutCallingServiceWhenPathAndBodyIdDiffer() throws Exception {
        mockMvc.perform(put(ApiRoutes.GYM + "/" + GYM_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gymCommandJson(OTHER_GYM_ID)))
                .andExpect(status().isBadRequest());

        then(gymService).should(never()).update(anyString(), any(UpdateGymCommand.class));
    }

    @Test
    void shouldReturnNoContentWhenGymIsDeleted() throws Exception {
        given(gymService.delete(GYM_ID)).willReturn(true);

        mockMvc.perform(delete(ApiRoutes.GYM + "/" + GYM_ID)).andExpect(status().isNoContent());
    }

    private static PagedResponse<GymDto> pageOf(GymDto dto) {
        return new PagedResponse<>(List.of(dto), new PaginationMetadata(1, 1, 20, 1, false, false, null, null));
    }

    private static GymDto gym(String id) {
        return new GymDto(
                id,
                "BJJ Dublin",
                "",
                GymStatus.Active,
                County.Dublin,
                null,
                null,
                null,
                null,
                List.of(),
                "https://example.com",
                null,
                "https://cdn.bjjeire.com/gyms/test-lg.webp",
                "https://cdn.bjjeire.com/gyms/test-thumb.webp");
    }

    private static String gymCommandJson(String id) {
        return """
            {
              "data": {
                "id": "%s",
                "name": "BJJ Dublin",
                "description": "",
                "status": "Active",
                "county": "Dublin",
                "trialOffer": { "isAvailable": false, "freeClasses": null, "freeDays": null, "notes": null },
                "location": {
                  "address": "1 Main Street",
                  "venue": "Dublin Gym",
                  "coordinates": { "type": "Point", "coordinates": [-6.2603, 53.3498], "placeName": "Dublin", "placeId": "test" }
                },
                "socialMedia": { "instagram": null, "facebook": null, "x": null, "youTube": null },
                "offeredClasses": [],
                "website": "https://example.com",
                "timetableUrl": null,
                "imageUrl": "https://cdn.bjjeire.com/gyms/test-lg.webp",
                "thumbnailUrl": "https://cdn.bjjeire.com/gyms/test-thumb.webp"
              }
            }
            """.formatted(id);
    }
}
