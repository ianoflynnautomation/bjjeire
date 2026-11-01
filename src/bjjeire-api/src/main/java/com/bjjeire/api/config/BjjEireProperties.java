package com.bjjeire.api.config;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bjjeire")
public record BjjEireProperties(
        Auth auth,
        Cors cors,
        Donation donation,
        RateLimit rateLimit,
        ReadOnlyMode readOnlyMode,
        Map<String, Boolean> featureFlags) {
    public BjjEireProperties {
        auth = auth == null ? new Auth("access_as_writer") : auth;
        cors = cors == null ? new Cors(List.of("https://bjjeire.com")) : cors;
        donation = donation == null ? new Donation("") : donation;
        rateLimit = rateLimit == null ? new RateLimit(false, 0, 0, 429) : rateLimit;
        readOnlyMode = readOnlyMode == null ? new ReadOnlyMode(true) : readOnlyMode;
        // Keep configuration order: Map.copyOf iterates in a per-JVM order, so which of two
        // relaxed spellings of a flag wins would differ between restarts and pods.
        featureFlags = featureFlags == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(featureFlags));
    }

    public record Auth(String writerScope) {}

    public record Cors(List<String> allowedOrigins) {
        public Cors {
            allowedOrigins = allowedOrigins == null || allowedOrigins.isEmpty()
                    ? List.of("https://bjjeire.com")
                    : List.copyOf(allowedOrigins);
        }
    }

    public record Donation(String bitcoinAddress) {
        public Donation {
            bitcoinAddress = bitcoinAddress == null ? "" : bitcoinAddress;
        }
    }

    public record RateLimit(
            boolean enabled, int permitLimit, int windowSeconds, int rejectionStatusCode, String trustedProxies) {
        public RateLimit(boolean enabled, int permitLimit, int windowSeconds, int rejectionStatusCode) {
            this(enabled, permitLimit, windowSeconds, rejectionStatusCode, "");
        }

        public RateLimit {
            rejectionStatusCode = rejectionStatusCode <= 0 ? 429 : rejectionStatusCode;
            trustedProxies = trustedProxies == null ? "" : trustedProxies;
        }

        public List<String> trustedProxyAddresses() {
            if (trustedProxies.isBlank()) {
                return List.of();
            }
            return Arrays.stream(trustedProxies.split(","))
                    .map(String::trim)
                    .filter(value -> !value.isEmpty())
                    .toList();
        }
    }

    public record ReadOnlyMode(boolean enabled) {}
}
