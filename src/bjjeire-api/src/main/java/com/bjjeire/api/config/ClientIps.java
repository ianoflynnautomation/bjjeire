package com.bjjeire.api.config;

import jakarta.servlet.http.HttpServletRequest;

final class ClientIps {
    private ClientIps() {}

    static String resolve(HttpServletRequest request, String fallback) {
        String cloudflareIp = request.getHeader("CF-Connecting-IP");
        if (cloudflareIp != null && !cloudflareIp.isBlank()) {
            return cloudflareIp.trim();
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",", 2)[0].trim();
        }

        return request.getRemoteAddr() == null ? fallback : request.getRemoteAddr();
    }
}
