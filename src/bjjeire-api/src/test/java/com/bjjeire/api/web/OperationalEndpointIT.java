package com.bjjeire.api.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.config.MetricsPortConfig.MetricsConnector;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.net.URI;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@code /metrics} is what the {@code bjj-api} ServiceMonitor in {@code bjjeire-gitops} scrapes, with no token. It is
 * served only on the metrics port, which no public route reaches; the API port that the public route forwards to
 * answers 404, so the meters never leave the cluster.
 */
class OperationalEndpointIT extends MongoIntegrationTest {

    @Autowired
    private MetricsConnector metricsConnector;

    @LocalServerPort
    private int apiPort;

    @Test
    void shouldServeEveryMeterToAnAnonymousScraperOnTheMetricsPort() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                "http://localhost:" + metricsConnector.localPort() + "/metrics", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody())
                .contains("registration_signup_started_total")
                .contains("registration_refund_failures_total")
                .contains("registration_webhook_rejected_total{reason=\"signature\"}")
                .contains("registration_mail_failures_total")
                .contains("competitor_identity_deletion_failures_total")
                .contains("jvm_memory_used_bytes");
    }

    @Test
    void shouldNotServeMetricsOnTheApiPortThatThePublicRouteReaches() {
        ResponseEntity<String> response = restTemplate.getForEntity("/metrics", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).doesNotContain("registration_");
    }

    @ParameterizedTest
    @ValueSource(strings = {"/%6detrics", "/%6D%65trics", "/metrics/", "//metrics", "/metrics;x=1"})
    void shouldNotServeMetricsOnTheApiPortHoweverThePathIsWritten(String path) {
        // URI.create keeps the path exactly as written: Spring Security and Spring MVC decode it, the filter must too.
        ResponseEntity<String> response =
                restTemplate.getForEntity(URI.create("http://localhost:" + apiPort + path), String.class);

        assertThat(response.getBody()).doesNotContain("registration_");
        assertThat(response.getStatusCode().is2xxSuccessful()).isFalse();
    }

    @Test
    void shouldRefuseAWriteRouteOnTheMetricsPortBeforeAuthentication() {
        // 404, not 401: the port filter runs ahead of Spring Security.
        ResponseEntity<String> response = restTemplate.exchange(
                URI.create("http://localhost:" + metricsConnector.localPort() + "/api/v1/gym"),
                HttpMethod.POST,
                new HttpEntity<>("{}"),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void shouldServeOnlyMetricsOnTheMetricsPort() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                "http://localhost:" + metricsConnector.localPort() + "/api/v1/gym", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
