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
                .andExpect(jsonPath("$.title").value("Method Not Allowed"))
                .andExpect(jsonPath("$.type").value("urn:bjjeire:method-not-allowed"));
    }

    /**
     * ADR-0013: read-only mode protects the directory; competition routes obey the BjjEireCompetitions flag instead.
     */
    @Test
    void readOnlyModeLetsBjjEireCompetitionFeatureWritesThroughAndStillBlocksTheDirectory() throws Exception {
        BjjEireProperties properties =
                properties(new BjjEireProperties.RateLimit(false, 0, 0, 429), new BjjEireProperties.ReadOnlyMode(true));

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .addFilters(new ReadOnlyModeFilter(properties, objectMapper))
                .build();

        for (String path : new String[] {
            "/api/v1/bjjeire-competition",
            "/api/v1/bjjeire-competition/abc/publish",
            "/api/v1/competitor/me",
            "/api/v1/registration"
        }) {
            mockMvc.perform(post(path)).andExpect(status().isOk());
        }
        // The router matches the decoded path, so the exemption does too.
        mockMvc.perform(post(java.net.URI.create("/api/v1/%62jjeire-competition")))
                .andExpect(status().isOk());
        for (String path : new String[] {
            "/api/v1/gym", "/api/v1/competition", "/api/v1/competitors", "/api/v1/bjjeire-competitions"
        }) {
            mockMvc.perform(post(path)).andExpect(status().isMethodNotAllowed());
        }
    }

    /** ADR-0016: merch routes obey the Merch flag, not read-only mode; the directory stays protected. */
    @Test
    @org.junit.jupiter.api.Tag("#6026")
    void readOnlyModeLetsMerchWritesThroughAndStillBlocksTheDirectory() throws Exception {
        BjjEireProperties properties =
                properties(new BjjEireProperties.RateLimit(false, 0, 0, 429), new BjjEireProperties.ReadOnlyMode(true));

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .addFilters(new ReadOnlyModeFilter(properties, objectMapper))
                .build();

        for (String path : new String[] {
            "/api/v1/product/admin",
            "/api/v1/product/admin/abc/publish",
            "/api/v1/order",
            "/api/v1/order/stripe-webhook"
        }) {
            mockMvc.perform(post(path)).andExpect(status().isOk());
        }
        // The router matches the decoded path, so the exemption does too.
        // The router may not map these spellings; read-only mode must not be the one answering.
        for (String path : new String[] {"/api/v1/order%2F", "/api/v1/%6frder", "/api/v1/%70roduct/admin"}) {
            mockMvc.perform(post(java.net.URI.create(path)))
                    .andExpect(result -> org.assertj.core.api.Assertions.assertThat(
                                    result.getResponse().getStatus())
                            .as(path)
                            .isNotEqualTo(405));
        }
        for (String path : new String[] {"/api/v1/store", "/api/v1/orders", "/api/v1/products"}) {
            mockMvc.perform(post(path)).andExpect(status().isMethodNotAllowed());
        }
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
                .andExpect(jsonPath("$.type").value("urn:bjjeire:rate-limit-exceeded"))
                .andExpect(jsonPath("$.title").value("API Rate Limit Exceeded"))
                .andExpect(jsonPath("$.limit").value(1))
                .andExpect(jsonPath("$.windowSeconds").value(60));
    }

    @Test
    void spoofedForwardedForDoesNotSplitTheBucketWhenThePeerIsUntrusted() throws Exception {
        MockMvc mockMvc = rateLimited(new BjjEireProperties.RateLimit(true, 1, 60, 429));

        mockMvc.perform(get("/test").with(request -> {
                    request.setRemoteAddr("203.0.113.1");
                    request.addHeader("X-Forwarded-For", "198.51.100.1");
                    return request;
                }))
                .andExpect(status().isOk());

        mockMvc.perform(get("/test").with(request -> {
                    request.setRemoteAddr("203.0.113.1");
                    request.addHeader("X-Forwarded-For", "198.51.100.2");
                    return request;
                }))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void forwardedForSplitsTheBucketWhenThePeerIsTrusted() throws Exception {
        MockMvc mockMvc = rateLimited(new BjjEireProperties.RateLimit(true, 1, 60, 429, "203.0.113.1"));

        mockMvc.perform(get("/test").with(request -> {
                    request.setRemoteAddr("203.0.113.1");
                    request.addHeader("X-Forwarded-For", "198.51.100.1");
                    return request;
                }))
                .andExpect(status().isOk());

        mockMvc.perform(get("/test").with(request -> {
                    request.setRemoteAddr("203.0.113.1");
                    request.addHeader("X-Forwarded-For", "198.51.100.2");
                    return request;
                }))
                .andExpect(status().isOk());

        mockMvc.perform(get("/test").with(request -> {
                    request.setRemoteAddr("203.0.113.1");
                    request.addHeader("X-Forwarded-For", "198.51.100.1");
                    return request;
                }))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void healthChecksDoNotConsumeAPermit() throws Exception {
        MockMvc mockMvc = rateLimited(new BjjEireProperties.RateLimit(true, 1, 60, 429));

        mockMvc.perform(get("/health").with(request -> {
                    request.setRemoteAddr("203.0.113.1");
                    return request;
                }))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/health").with(request -> {
                    request.setRemoteAddr("203.0.113.1");
                    return request;
                }))
                .andExpect(status().isNotFound());
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

    private MockMvc rateLimited(BjjEireProperties.RateLimit rateLimit) {
        BjjEireProperties properties = properties(rateLimit, new BjjEireProperties.ReadOnlyMode(false));
        Clock clock = Clock.fixed(Instant.parse("2026-06-03T06:00:00Z"), ZoneOffset.UTC);
        return MockMvcBuilders.standaloneSetup(new TestController())
                .addFilters(new RateLimitFilter(properties, objectMapper, clock))
                .build();
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

        @PostMapping({
            "/test",
            "/api/v1/bjjeire-competition",
            "/api/v1/bjjeire-competition/abc/publish",
            "/api/v1/competitor/me",
            "/api/v1/registration",
            "/api/v1/gym",
            "/api/v1/competition",
            "/api/v1/competitors",
            "/api/v1/bjjeire-competitions",
            "/api/v1/product/admin",
            "/api/v1/product/admin/abc/publish",
            "/api/v1/order",
            "/api/v1/order/stripe-webhook",
            "/api/v1/store",
            "/api/v1/orders",
            "/api/v1/products"
        })
        ResponseEntity<String> post() {
            return ResponseEntity.ok("ok");
        }
    }
}
