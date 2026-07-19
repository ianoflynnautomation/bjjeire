package com.bjjeire.api.config;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.json.JsonMapper;

class CrossCuttingFilterTest {
    private final JsonMapper objectMapper = new JsonMapper();

    @Test
    void readOnlyModeBlocksWriteRequests() throws Exception {
        BjjEireProperties properties =
                properties(new BjjEireProperties.RateLimit(false, 0, 0, 429), new BjjEireProperties.ReadOnlyMode(true));

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .addFilters(new ReadOnlyModeFilter(properties, objectMapper))
                .build();

        mockMvc.perform(post("/test"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string("Allow", "GET, HEAD, OPTIONS"))
                .andExpect(jsonPath("$.title").value("Method Not Allowed"));
    }

    @Test
    void rateLimitRejectsRequestsAfterPermitLimit() throws Exception {
        BjjEireProperties properties = properties(
                new BjjEireProperties.RateLimit(true, 1, 60, 429), new BjjEireProperties.ReadOnlyMode(false));
        Clock clock = Clock.fixed(Instant.parse("2026-06-03T06:00:00Z"), ZoneOffset.UTC);

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .addFilters(new RateLimitFilter(properties, objectMapper, clock))
                .build();

        mockMvc.perform(get("/test").with(request -> {
                    request.setRemoteAddr("203.0.113.1");
                    return request;
                }))
                .andExpect(status().isOk())
                .andExpect(header().string("X-RateLimit-Limit", "1"))
                .andExpect(header().string("X-RateLimit-Remaining", "0"));

        mockMvc.perform(get("/test").with(request -> {
                    request.setRemoteAddr("203.0.113.1");
                    return request;
                }))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(jsonPath("$.title").value("API Rate Limit Exceeded"))
                .andExpect(jsonPath("$.limit").value(1))
                .andExpect(jsonPath("$.windowSeconds").value(60));
    }

    @Test
    void securityHeadersAreApplied() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .addFilters(new SecurityHeadersFilter())
                .build();

        mockMvc.perform(get("/test"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("Content-Security-Policy", containsString("default-src 'self'")));
    }

    private static BjjEireProperties properties(
            BjjEireProperties.RateLimit rateLimit, BjjEireProperties.ReadOnlyMode readOnlyMode) {
        return new BjjEireProperties(null, null, null, rateLimit, readOnlyMode, Map.of());
    }

    @RestController
    private static final class TestController {
        @GetMapping("/test")
        ResponseEntity<String> get() {
            return ResponseEntity.ok("ok");
        }

        @PostMapping("/test")
        ResponseEntity<String> post() {
            return ResponseEntity.ok("ok");
        }
    }
}
