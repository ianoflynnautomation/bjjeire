package com.bjjeire.api.web;

import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.function.Predicate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

/**
 * Answers 404 for every route of a feature while its flag is off, so a switched-off feature looks absent to every
 * caller instead of asking for a token. {@code SecurityConfig} places each subclass ahead of authentication.
 */
abstract class FeatureGateFilter extends OncePerRequestFilter {
    private final FeatureFlagService featureFlags;
    private final ObjectMapper objectMapper;
    private final FeatureFlag flag;
    private final Predicate<String> featurePath;
    private final String detail;

    FeatureGateFilter(
            FeatureFlagService featureFlags,
            ObjectMapper objectMapper,
            FeatureFlag flag,
            Predicate<String> featurePath,
            String detail) {
        this.featureFlags = featureFlags;
        this.objectMapper = objectMapper;
        this.flag = flag;
        this.featurePath = featurePath;
        this.detail = detail;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!featurePath.test(request.getRequestURI())
                || featureFlags.isEnabled(flag, FeatureFlagContext.anonymous())) {
            filterChain.doFilter(request, response);
            return;
        }

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, detail);
        problem.setTitle("Not Found");
        problem.setType(ProblemTypes.NOT_FOUND);
        problem.setInstance(URI.create(request.getRequestURI()));
        // Same rule as ApiExceptionHandler and SecurityProblemHandlers: every problem names its trace.
        SpanContext spanContext = Span.current().getSpanContext();
        problem.setProperty("traceId", spanContext.isValid() ? spanContext.getTraceId() : request.getRequestId());

        response.setStatus(HttpStatus.NOT_FOUND.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), problem);
    }
}
