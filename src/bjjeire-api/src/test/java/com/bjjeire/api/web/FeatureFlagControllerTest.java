package com.bjjeire.api.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.config.BjjEireProperties;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class FeatureFlagControllerTest {
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        BjjEireProperties properties = new BjjEireProperties(
                null,
                new BjjEireProperties.Cors(List.of("https://bjjeire.com")),
                null,
                null,
                null,
                Map.of(
                        "BjjEvents", true,
                        "Gyms", true,
                        "Competitions", false,
                        "Stores", true));

        mockMvc = MockMvcBuilders.standaloneSetup(new FeatureFlagController(properties))
                .build();
    }

    @Test
    void shouldReturnFrontendFeatureFlagsWhenListing() throws Exception {
        mockMvc.perform(get(ApiRoutes.FEATURE_FLAG))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.BjjEvents").value(true))
                .andExpect(jsonPath("$.Gyms").value(true))
                .andExpect(jsonPath("$.Competitions").value(false))
                .andExpect(jsonPath("$.Stores").value(true));
    }

    @Test
    void shouldMatchRelaxedConfigurationKeysWhenListing() throws Exception {
        BjjEireProperties properties = new BjjEireProperties(
                null,
                null,
                null,
                null,
                null,
                Map.of(
                        "bjj-events", true,
                        "gyms", true,
                        "competitions", true,
                        "stores", true));

        MockMvc relaxedKeyMockMvc = MockMvcBuilders.standaloneSetup(new FeatureFlagController(properties))
                .build();

        relaxedKeyMockMvc
                .perform(get(ApiRoutes.FEATURE_FLAG))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.BjjEvents").value(true))
                .andExpect(jsonPath("$.Gyms").value(true))
                .andExpect(jsonPath("$.Competitions").value(true))
                .andExpect(jsonPath("$.Stores").value(true));
    }
}
