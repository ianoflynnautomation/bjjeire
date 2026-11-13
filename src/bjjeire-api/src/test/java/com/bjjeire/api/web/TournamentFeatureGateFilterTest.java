package com.bjjeire.api.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bjjeire.api.config.BjjEireProperties;
import java.net.URI;
import java.util.Map;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.json.JsonMapper;

/** #5038: with the Tournaments flag off, the tournament routes do not exist and nothing else changes. */
class TournamentFeatureGateFilterTest {

    @ParameterizedTest
    @Tag("#5038")
    @ValueSource(
            strings = {
                "/api/v1/tournament",
                "/api/v1/tournament/bjjeire",
                "/api/v1/tournament/abc/leaderboard",
                "/api/v1/competitor/me",
                "/api/v1/registration/me",
                // Security and MVC match the decoded path, so the gate must too.
                "/api/v1/%74ournament",
                "/api/v1/%63ompetitor/me",
                "/api/v1/registratio%6E/me"
            })
    void shouldAnswerNotFoundOnReadsWhenFlagIsOff(String path) throws Exception {
        gated(false)
                // A URI keeps the percent-encoding as written; a String would be encoded again.
                .perform(get(URI.create(path)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:not-found"))
                .andExpect(jsonPath("$.detail").value("The tournament feature is not available."));
    }

    @ParameterizedTest
    @Tag("#5038")
    @ValueSource(strings = {"/api/v1/tournament", "/api/v1/registration", "/api/v1/registration/stripe-webhook"})
    void shouldAnswerNotFoundOnWritesWhenFlagIsOff(String path) throws Exception {
        gated(false)
                .perform(post(path))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:not-found"));
    }

    @ParameterizedTest
    @Tag("#5036")
    @ValueSource(strings = {"/api/v1/gym", "/api/v1/bjjevent", "/api/v1/competition", "/api/v1/store"})
    void shouldLeaveDirectoryRoutesAloneWhenFlagIsOff(String path) throws Exception {
        gated(false).perform(get(path)).andExpect(status().isOk());
    }

    @Test
    void shouldPassTournamentRoutesThroughWhenFlagIsOn() throws Exception {
        gated(true).perform(get("/api/v1/tournament")).andExpect(status().isOk());
        gated(true).perform(post("/api/v1/registration")).andExpect(status().isOk());
    }

    private static MockMvc gated(boolean enabled) {
        FeatureFlagService flags = new FeatureFlagServiceImpl(
                new BjjEireProperties(null, null, null, null, null, Map.of("Tournaments", enabled)));
        return MockMvcBuilders.standaloneSetup(new TestController())
                .addFilters(new TournamentFeatureGateFilter(flags, new JsonMapper()))
                .build();
    }

    @RestController
    private static final class TestController {
        @GetMapping({"/api/v1/tournament", "/api/v1/gym", "/api/v1/bjjevent", "/api/v1/competition", "/api/v1/store"})
        ResponseEntity<String> get() {
            return ResponseEntity.ok("ok");
        }

        @PostMapping("/api/v1/registration")
        ResponseEntity<String> post() {
            return ResponseEntity.ok("ok");
        }
    }
}
