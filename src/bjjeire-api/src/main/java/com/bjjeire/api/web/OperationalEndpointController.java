package com.bjjeire.api.web;

import java.util.Set;
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

@RestController
@RequiredArgsConstructor
public class OperationalEndpointController {
    private final HealthEndpoint healthEndpoint;
    private final ObjectProvider<PrometheusScrapeEndpoint> prometheusScrapeEndpoint;

    @GetMapping("/health")
    public HealthDescriptor health() {
        return healthEndpoint.health();
    }

    @GetMapping(value = "/metrics", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<byte[]> metrics() {
        PrometheusScrapeEndpoint endpoint = prometheusScrapeEndpoint.getIfAvailable();
        if (endpoint == null) {
            return ResponseEntity.notFound().build();
        }

        WebEndpointResponse<byte[]> scrape = endpoint.scrape(PrometheusOutputFormat.CONTENT_TYPE_004, Set.of());
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(scrape.getBody());
    }
}
