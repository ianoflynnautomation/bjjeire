package com.bjjeire.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.Principal;
import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(10)
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {
    private final BjjEireProperties properties;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        BjjEireProperties.RateLimit options = properties.rateLimit();
        if (!options.enabled() || options.permitLimit() <= 0 || options.windowSeconds() <= 0) {
            filterChain.doFilter(request, response);
            return;
        }

        long now = clock.instant().getEpochSecond();
        Window window = windows.compute(partitionKey(request), (key, current) -> {
            if (current == null || now >= current.resetAtEpochSecond) {
                return new Window(1, now + options.windowSeconds());
            }

            current.count++;
            return current;
        });

        if (window.count <= options.permitLimit()) {
            response.setHeader("X-RateLimit-Limit", Integer.toString(options.permitLimit()));
            response.setHeader("X-RateLimit-Remaining", Integer.toString(options.permitLimit() - window.count));
            response.setHeader("X-RateLimit-Reset", Long.toString(window.resetAtEpochSecond));
            filterChain.doFilter(request, response);
            return;
        }

        int retryAfterSeconds = Math.max(1, (int) (window.resetAtEpochSecond - now));
        Map<String, Object> problem = new LinkedHashMap<>();
        problem.put("type", "urn:bjjeire:rate-limit-exceeded");
        problem.put("title", "API Rate Limit Exceeded");
        problem.put("status", options.rejectionStatusCode());
        problem.put(
                "detail",
                "You have reached the maximum number of requests allowed. Please try again after the specified period.");
        problem.put("retryAfterSeconds", retryAfterSeconds);
        problem.put("limit", options.permitLimit());
        problem.put("windowSeconds", options.windowSeconds());

        response.setStatus(options.rejectionStatusCode());
        response.setHeader("Retry-After", Integer.toString(retryAfterSeconds));
        response.setHeader("X-RateLimit-Limit", Integer.toString(options.permitLimit()));
        response.setHeader("X-RateLimit-Remaining", "0");
        response.setHeader("X-RateLimit-Reset", Long.toString(window.resetAtEpochSecond));
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), problem);
    }

    private static String partitionKey(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if (principal != null
                && principal.getName() != null
                && !principal.getName().isBlank()) {
            return principal.getName();
        }

        String cloudflareIp = request.getHeader("CF-Connecting-IP");
        if (cloudflareIp != null && !cloudflareIp.isBlank()) {
            return cloudflareIp.trim();
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",", 2)[0].trim();
        }

        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private static final class Window {
        private int count;
        private final long resetAtEpochSecond;

        private Window(int count, long resetAtEpochSecond) {
            this.count = count;
            this.resetAtEpochSecond = resetAtEpochSecond;
        }
    }
}
