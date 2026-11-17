package com.bjjeire.api.config;

import com.bjjeire.api.web.ProblemTypes;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.UrlPathHelper;
import tools.jackson.databind.ObjectMapper;

/**
 * Serves {@code /metrics} on its own port ({@code METRICS_PORT}, 9464 by default) and nowhere else. The public route
 * forwards every path on the API host to the API port, so meters served there would be readable from the internet. Only
 * the {@code bjj-api} ServiceMonitor, inside the cluster, scrapes the metrics port. Health stays on the API port, where
 * the probes and the frontend's readiness check already look for it.
 */
@Configuration
public class MetricsPortConfig {
    static final String METRICS_PATH = "/metrics";

    /** The extra Tomcat connector for {@code /metrics}. {@link #localPort()} is the bound port once it has started. */
    public static final class MetricsConnector {
        private final Connector connector;

        MetricsConnector(int port) {
            this.connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            this.connector.setPort(port);
        }

        public int localPort() {
            return connector.getLocalPort();
        }

        Connector connector() {
            return connector;
        }
    }

    @Bean
    MetricsConnector metricsConnector(@Value("${bjjeire.metrics.port:9464}") int port) {
        return new MetricsConnector(port);
    }

    @Bean
    WebServerFactoryCustomizer<TomcatServletWebServerFactory> metricsPort(MetricsConnector metricsConnector) {
        return factory -> factory.addAdditionalConnectors(metricsConnector.connector());
    }

    @Bean
    MetricsPortFilter metricsPortFilter(MetricsConnector metricsConnector, ObjectMapper objectMapper) {
        return new MetricsPortFilter(metricsConnector, objectMapper);
    }

    /**
     * {@code /metrics} only on the metrics port, and only {@code /metrics} there. Anything else is a 404 problem,
     * written here as {@code BjjEireCompetitionFeatureGateFilter} does: an error dispatch would reach the security
     * chain first.
     */
    @Order(Ordered.HIGHEST_PRECEDENCE)
    static final class MetricsPortFilter extends OncePerRequestFilter {
        private final MetricsConnector metricsConnector;
        private final ObjectMapper objectMapper;

        MetricsPortFilter(MetricsConnector metricsConnector, ObjectMapper objectMapper) {
            this.metricsConnector = metricsConnector;
            this.objectMapper = objectMapper;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            boolean onMetricsPort = request.getLocalPort() == metricsConnector.localPort();
            // The decoded, normalised path that Spring Security and Spring MVC match, so /%6detrics counts as /metrics.
            boolean metricsPath = METRICS_PATH.equals(UrlPathHelper.defaultInstance.getPathWithinApplication(request));
            if (onMetricsPort != metricsPath) {
                ProblemDetail problem =
                        ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "The requested resource was not found.");
                problem.setTitle("Not Found");
                problem.setType(ProblemTypes.NOT_FOUND);
                problem.setInstance(URI.create(request.getRequestURI()));
                SpanContext spanContext = Span.current().getSpanContext();
                problem.setProperty(
                        "traceId", spanContext.isValid() ? spanContext.getTraceId() : request.getRequestId());
                response.setStatus(HttpStatus.NOT_FOUND.value());
                response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                objectMapper.writeValue(response.getOutputStream(), problem);
                return;
            }
            chain.doFilter(request, response);
        }
    }
}
