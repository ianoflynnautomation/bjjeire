package com.bjjeire.api.config;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.ConstructorBinding;

@ConfigurationProperties(prefix = "bjjeire")
public record BjjEireProperties(
        Auth auth,
        Cors cors,
        Donation donation,
        RateLimit rateLimit,
        ReadOnlyMode readOnlyMode,
        Map<String, Boolean> featureFlags,
        CompetitorAuth competitorAuth) {
    // Two constructors: tell Spring Boot which one binds configuration.
    @ConstructorBinding
    public BjjEireProperties {
        competitorAuth = competitorAuth == null ? new CompetitorAuth("", List.of(), "") : competitorAuth;
        auth = auth == null ? new Auth("access_as_writer") : auth;
        cors = cors == null ? new Cors(List.of("https://bjjeire.com")) : cors;
        donation = donation == null ? new Donation("") : donation;
        rateLimit = rateLimit == null ? new RateLimit(false, 0, 0, 429) : rateLimit;
        readOnlyMode = readOnlyMode == null ? new ReadOnlyMode(true) : readOnlyMode;
        // Keep configuration order: Map.copyOf iterates in a per-JVM order, so which of two
        // relaxed spellings of a flag wins would differ between restarts and pods.
        featureFlags = featureFlags == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(featureFlags));
    }

    /** Convenience for callers that do not configure competitor sign-in. */
    public BjjEireProperties(
            Auth auth,
            Cors cors,
            Donation donation,
            RateLimit rateLimit,
            ReadOnlyMode readOnlyMode,
            Map<String, Boolean> featureFlags) {
        this(auth, cors, donation, rateLimit, readOnlyMode, featureFlags, null);
    }

    public record Auth(String writerScope) {}

    /**
     * The second token issuer: the external tenant that holds competitor accounts (ADR-0012).
     *
     * @param issuerUri issuer of competitor tokens; blank means no competitor tenant is trusted
     * @param audiences accepted {@code aud} values of the competitor-facing API registration
     * @param scope scope a competitor token must carry
     */
    public record CompetitorAuth(String issuerUri, List<String> audiences, String scope) {
        public static final String DEFAULT_SCOPE = "access_as_competitor";

        public CompetitorAuth {
            issuerUri = issuerUri == null ? "" : issuerUri.trim();
            audiences = audiences == null
                    ? List.of()
                    : audiences.stream()
                            .filter(value -> value != null && !value.isBlank())
                            .distinct()
                            .toList();
            scope = scope == null || scope.isBlank() ? DEFAULT_SCOPE : scope.trim();
        }
    }

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
