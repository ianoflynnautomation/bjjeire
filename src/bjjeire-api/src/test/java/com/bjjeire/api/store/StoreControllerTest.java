package com.bjjeire.api.store;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationMetadata;
import com.bjjeire.api.web.ApiExceptionHandler;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class StoreControllerTest {
    private static final String STORE_ID = "665624c1ad01ce465c6cf456";

    @Mock
    private StoreService storeService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new StoreController(storeService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void shouldReturnPagedStoresWhenListing() throws Exception {
        given(storeService.getAll(any(), anyString())).willReturn(pageOf(store()));

        mockMvc.perform(get(ApiRoutes.STORE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(STORE_ID))
                .andExpect(jsonPath("$.data[0].name").value("BJJ Shop"))
                .andExpect(jsonPath("$.data[0].isActive").value(true))
                .andExpect(jsonPath("$.pagination.totalItems").value(1));
    }

    @Test
    void shouldRejectListingWhenPageIsNotANumber() throws Exception {
        mockMvc.perform(get(ApiRoutes.STORE).param("page", "invalid")).andExpect(status().isBadRequest());
    }

    private static PagedResponse<StoreDto> pageOf(StoreDto dto) {
        return new PagedResponse<>(List.of(dto), new PaginationMetadata(1, 1, 20, 1, false, false, null, null));
    }

    private static StoreDto store() {
        return new StoreDto(STORE_ID, "BJJ Shop", "Equipment store", "https://example.com", null, true);
    }
}
