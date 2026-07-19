package com.bjjeire.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

@Component
@Order(20)
@RequiredArgsConstructor
public class ReadOnlyModeFilter extends OncePerRequestFilter {
    private static final Set<String> ALLOWED_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final BjjEireProperties properties;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!properties.readOnlyMode().enabled() || ALLOWED_METHODS.contains(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.METHOD_NOT_ALLOWED,
                "The API is currently in read-only mode. Write operations are disabled.");
        problem.setTitle("Method Not Allowed");
        problem.setType(URI.create("https://tools.ietf.org/html/rfc7231#section-6.5.5"));

        response.setStatus(HttpStatus.METHOD_NOT_ALLOWED.value());
        response.setHeader("Allow", "GET, HEAD, OPTIONS");
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), problem);
    }
}
