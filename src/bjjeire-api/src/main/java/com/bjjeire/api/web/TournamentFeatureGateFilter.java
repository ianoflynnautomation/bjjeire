package com.bjjeire.api.web;

import com.bjjeire.api.common.ApiRoutes;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

/**
 * Answers 404 for every tournament, competitor and registration route while the {@code Tournaments} flag is off
 * (ADR-0013).
 *
 * <p>Not a component: {@code SecurityConfig} places it ahead of authentication, so a switched-off feature looks absent
 * to every caller instead of asking for a token.
 */
public final class TournamentFeatureGateFilter extends OncePerRequestFilter {
    static final String DETAIL = "The tournament feature is not available.";

    private final FeatureFlagService featureFlags;
    private final ObjectMapper objectMapper;

    public TournamentFeatureGateFilter(FeatureFlagService featureFlags, ObjectMapper objectMapper) {
        this.featureFlags = featureFlags;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!ApiRoutes.isTournamentFeaturePath(request.getRequestURI())
                || featureFlags.isEnabled(FeatureFlag.TOURNAMENTS, FeatureFlagContext.anonymous())) {
            filterChain.doFilter(request, response);
            return;
        }

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, DETAIL);
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
