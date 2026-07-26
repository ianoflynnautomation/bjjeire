package com.bjjeire.api.config;

import java.util.List;
import java.util.Locale;
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
        featureFlags = featureFlags == null ? Map.of() : Map.copyOf(featureFlags);
    }

    public boolean isFeatureEnabled(String name) {
        Boolean exactMatch = featureFlags.get(name);
        if (exactMatch != null) {
            return exactMatch;
        }

        String normalizedName = normalizeFeatureFlagName(name);
        return featureFlags.entrySet().stream()
                .filter(entry -> normalizeFeatureFlagName(entry.getKey()).equals(normalizedName))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(false);
    }

    private static String normalizeFeatureFlagName(String name) {
        return name.replace("-", "").replace("_", "").toLowerCase(Locale.ROOT);
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

    public record RateLimit(boolean enabled, int permitLimit, int windowSeconds, int rejectionStatusCode) {
        public RateLimit {
            rejectionStatusCode = rejectionStatusCode <= 0 ? 429 : rejectionStatusCode;
        }
    }

    public record ReadOnlyMode(boolean enabled) {}
}
