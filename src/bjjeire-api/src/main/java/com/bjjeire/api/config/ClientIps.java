package com.bjjeire.api.config;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

final class ClientIps {
    private ClientIps() {}

    static String resolve(HttpServletRequest request, String fallback, List<String> trustedProxies) {
        String remoteAddress = request.getRemoteAddr();
        if (TrustedProxies.trusts(remoteAddress, trustedProxies)) {
            String cloudflareIp = request.getHeader("CF-Connecting-IP");
            if (cloudflareIp != null && !cloudflareIp.isBlank()) {
                return cloudflareIp.trim();
            }

            String forwardedFor = request.getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                return forwardedFor.split(",", 2)[0].trim();
            }
        }

        if (remoteAddress == null || remoteAddress.isBlank()) {
            return fallback;
        }
        return remoteAddress;
    }
}
