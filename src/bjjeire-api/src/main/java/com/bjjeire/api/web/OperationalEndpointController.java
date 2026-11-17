package com.bjjeire.api.web;

import com.bjjeire.api.config.MetricsPortConfig.MetricsConnector;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.actuate.endpoint.web.WebEndpointResponse;
import org.springframework.boot.health.actuate.endpoint.HealthDescriptor;
import org.springframework.boot.health.actuate.endpoint.HealthEndpoint;
import org.springframework.boot.micrometer.metrics.autoconfigure.export.prometheus.PrometheusOutputFormat;
import org.springframework.boot.micrometer.metrics.autoconfigure.export.prometheus.PrometheusScrapeEndpoint;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Compatibility aliases for health/metrics used by compose healthchecks and Prometheus. {@code /metrics} needs no token
 * and answers only on the metrics port ({@link com.bjjeire.api.config.MetricsPortConfig}), which no public route
 * reaches.
 */
@RestController
@RequiredArgsConstructor
public class OperationalEndpointController {
    private final HealthEndpoint healthEndpoint;
    private final ObjectProvider<PrometheusScrapeEndpoint> prometheusScrapeEndpoint;
    private final MetricsConnector metricsConnector;

    @GetMapping("/health")
    public HealthDescriptor health() {
        return healthEndpoint.health();
    }

    // Hidden from the published API: it answers only on the metrics port, never on the API host.
    @Hidden
    @GetMapping(value = "/metrics", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<byte[]> metrics(HttpServletRequest request) {
        PrometheusScrapeEndpoint endpoint = prometheusScrapeEndpoint.getIfAvailable();
        // The port, not the path, decides: however the path is written, the API port never serves the meters.
        if (endpoint == null || request.getLocalPort() != metricsConnector.localPort()) {
            return ResponseEntity.notFound().build();
        }

        // null means every meter: an empty set is a filter that matches none, which served an empty page.
        WebEndpointResponse<byte[]> scrape = endpoint.scrape(PrometheusOutputFormat.CONTENT_TYPE_004, null);
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(scrape.getBody());
    }
}
