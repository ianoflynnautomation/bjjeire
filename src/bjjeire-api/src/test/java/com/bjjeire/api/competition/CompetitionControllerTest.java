package com.bjjeire.api.competition;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationMetadata;
import com.bjjeire.api.web.ApiExceptionHandler;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class CompetitionControllerTest {
    private static final String COMPETITION_ID = "665624c1ad01ce465c6cf456";

    @Mock
    private CompetitionService competitionService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new CompetitionController(competitionService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void shouldReturnPagedCompetitionsWhenListing() throws Exception {
        given(competitionService.getAll(any(), anyBoolean(), anyString())).willReturn(pageOf(competition()));

        mockMvc.perform(get("/api/v1/Competition").param("includeInactive", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(COMPETITION_ID))
                .andExpect(jsonPath("$.data[0].slug").value("irish-open"))
                .andExpect(jsonPath("$.data[0].isActive").value(true))
                .andExpect(jsonPath("$.pagination.totalItems").value(1));
    }

    @Test
    void shouldRejectListingWhenIncludeInactiveIsNotBoolean() throws Exception {
        mockMvc.perform(get("/api/v1/Competition").param("includeInactive", "invalid"))
                .andExpect(status().isBadRequest());
    }

    private static PagedResponse<CompetitionDto> pageOf(CompetitionDto dto) {
        return new PagedResponse<>(List.of(dto), new PaginationMetadata(1, 1, 20, 1, false, false, null, null));
    }

    private static CompetitionDto competition() {
        return new CompetitionDto(
                COMPETITION_ID,
                "irish-open",
                "Irish Open",
                "Annual competition",
                "IBJJF",
                "Ireland",
                "https://example.com",
                null,
                null,
                List.of("gi"),
                Instant.parse("2026-08-01T09:00:00Z"),
                null,
                true);
    }
}
