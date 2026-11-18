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
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.json.ProblemDetailJacksonMixin;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.json.JsonMapper;

/** #6026, #6027: with the Merch flag off, the product and order routes do not exist and nothing else changes. */
class MerchFeatureGateFilterTest {

    @ParameterizedTest
    @Tag("#6026")
    @ValueSource(
            strings = {
                "/api/v1/product",
                "/api/v1/product/harp-rashguard",
                "/api/v1/product/photo/abc",
                "/api/v1/product/admin",
                "/api/v1/order/0123456789abcdef01234567",
                "/api/v1/order/delivery",
                "/api/v1/order/admin/dashboard",
                // Security and MVC match the decoded path, so the gate must too.
                "/api/v1/%70roduct",
                "/api/v1/%6frder/delivery"
            })
    void shouldAnswerNotFoundOnReadsWhenFlagIsOff(String path) throws Exception {
        gated(false)
                // A URI keeps the percent-encoding as written; a String would be encoded again.
                .perform(get(URI.create(path)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:not-found"))
                .andExpect(jsonPath("$.detail").value("The BJJ Éire merch shop is not available."))
                .andExpect(jsonPath("$.traceId").exists());
    }

    @ParameterizedTest
    @Tag("#6026")
    @ValueSource(
            strings = {
                "/api/v1/order",
                "/api/v1/order/0123456789abcdef01234567/checkout",
                "/api/v1/order/stripe-webhook",
                "/api/v1/product/admin",
                "/api/v1/order%2F"
            })
    void shouldAnswerNotFoundOnWritesWhenFlagIsOff(String path) throws Exception {
        gated(false)
                .perform(post(URI.create(path)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:not-found"))
                .andExpect(jsonPath("$.traceId").exists());
    }

    @ParameterizedTest
    @Tag("#6027")
    @ValueSource(
            strings = {
                "/api/v1/gym",
                "/api/v1/bjjevent",
                "/api/v1/competition",
                "/api/v1/store",
                "/api/v1/bjjeire-competition",
                "/api/v1/orders",
                "/api/v1/products"
            })
    void shouldLeaveEveryOtherRouteAloneWhenFlagIsOff(String path) throws Exception {
        gated(false).perform(get(path)).andExpect(status().isOk());
    }

    @Test
    @Tag("#6026")
    void shouldPassMerchRoutesThroughWhenFlagIsOn() throws Exception {
        gated(true).perform(get("/api/v1/product")).andExpect(status().isOk());
        gated(true).perform(post("/api/v1/order")).andExpect(status().isOk());
    }

    /** As the application's mapper writes a problem: extensions at top level, not under "properties". */
    private static JsonMapper problemMapper() {
        return JsonMapper.builder()
                .addMixIn(ProblemDetail.class, ProblemDetailJacksonMixin.class)
                .build();
    }

    private static MockMvc gated(boolean enabled) {
        FeatureFlagService flags = new FeatureFlagServiceImpl(
                new BjjEireProperties(null, null, null, null, null, Map.of("Merch", enabled)));
        return MockMvcBuilders.standaloneSetup(new TestController())
                .addFilters(new MerchFeatureGateFilter(flags, problemMapper()))
                .build();
    }

    @RestController
    private static final class TestController {
        @GetMapping({
            "/api/v1/product",
            "/api/v1/gym",
            "/api/v1/bjjevent",
            "/api/v1/competition",
            "/api/v1/store",
            "/api/v1/bjjeire-competition",
            "/api/v1/orders",
            "/api/v1/products"
        })
        ResponseEntity<String> get() {
            return ResponseEntity.ok("ok");
        }

        @PostMapping("/api/v1/order")
        ResponseEntity<String> post() {
            return ResponseEntity.ok("ok");
        }
    }
}
