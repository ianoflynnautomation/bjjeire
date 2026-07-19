package com.bjjeire.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.Principal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(5)
public class RequestLoggingFilter extends OncePerRequestFilter {
    private static final Logger LOGGER = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long start = System.nanoTime();
        String traceId = request.getRequestId();

        try (MDC.MDCCloseable ignored = MDC.putCloseable("traceId", traceId)) {
            filterChain.doFilter(request, response);
        } finally {
            double elapsedMs = (System.nanoTime() - start) / 1_000_000.0;
            log(request, response, traceId, elapsedMs);
        }
    }

    private static void log(
            HttpServletRequest request, HttpServletResponse response, String traceId, double elapsedMs) {
        int status = response.getStatus();
        if (isSuccessfulHealthCheck(request, status)) {
            LOGGER.debug(message(), args(request, response, traceId, elapsedMs));
        } else if (status >= 500) {
            LOGGER.error(message(), args(request, response, traceId, elapsedMs));
        } else if (status >= 400) {
            LOGGER.warn(message(), args(request, response, traceId, elapsedMs));
        } else {
            LOGGER.info(message(), args(request, response, traceId, elapsedMs));
        }
    }

    private static boolean isSuccessfulHealthCheck(HttpServletRequest request, int status) {
        return status < 400 && request.getRequestURI().startsWith("/health");
    }

    private static String message() {
        return "HTTP {} {} responded {} in {} ms for TraceId {} ClientIP={} UserAgent=\"{}\" Host={} Scheme={} UserId={}";
    }

    private static Object[] args(
            HttpServletRequest request, HttpServletResponse response, String traceId, double elapsedMs) {
        return new Object[] {
            request.getMethod(),
            request.getRequestURI(),
            response.getStatus(),
            String.format("%.4f", elapsedMs),
            traceId,
            clientIp(request),
            userAgent(request),
            request.getServerName(),
            request.getScheme(),
            userId(request)
        };
    }

    private static String clientIp(HttpServletRequest request) {
        String cloudflareIp = request.getHeader("CF-Connecting-IP");
        if (cloudflareIp != null && !cloudflareIp.isBlank()) {
            return cloudflareIp.trim();
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",", 2)[0].trim();
        }

        return request.getRemoteAddr() == null ? "Unknown" : request.getRemoteAddr();
    }

    private static String userAgent(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        return userAgent == null || userAgent.isBlank() ? "Unknown" : userAgent;
    }

    private static String userId(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        return principal == null
                        || principal.getName() == null
                        || principal.getName().isBlank()
                ? "Anonymous"
                : principal.getName();
    }
}
