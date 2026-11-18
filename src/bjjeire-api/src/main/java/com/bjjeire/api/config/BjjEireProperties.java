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
        CompetitorAuth competitorAuth,
        LocalSignIn localSignIn,
        CompetitorDirectory competitorDirectory,
        Stripe stripe,
        Mail mail,
        Registration registration,
        Order order) {
    // Two constructors: tell Spring Boot which one binds configuration.
    @ConstructorBinding
    public BjjEireProperties {
        competitorAuth = competitorAuth == null ? new CompetitorAuth("", List.of(), "") : competitorAuth;
        localSignIn = localSignIn == null ? new LocalSignIn(false, "") : localSignIn;
        competitorDirectory =
                competitorDirectory == null ? new CompetitorDirectory("", "", "", "", "", "") : competitorDirectory;
        stripe = java.util.Objects.requireNonNullElseGet(stripe, () -> new Stripe("", "", "", ""));
        mail = java.util.Objects.requireNonNullElseGet(mail, () -> new Mail(""));
        registration = java.util.Objects.requireNonNullElseGet(registration, () -> new Registration(null, null, null));
        order = java.util.Objects.requireNonNullElseGet(order, () -> new Order(null, 0, 0, 0, 0, 0));
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
        this(auth, cors, donation, rateLimit, readOnlyMode, featureFlags, null, null, null, null, null, null, null);
    }

    /**
     * Organiser sign-in for local development without an Entra tenant (ADR-0014). Off by default; the API refuses to
     * start with it on unless the {@code local} profile is active.
     *
     * @param enabled whether the API issues and trusts local organiser tokens
     * @param secret HS256 signing secret, at least 32 bytes when enabled
     */
    public record LocalSignIn(boolean enabled, String secret) {
        public LocalSignIn {
            secret = secret == null ? "" : secret;
        }
    }

    public record Auth(String writerScope) {}

    /**
     * Application credentials for Microsoft Graph in the competitor tenant, used only to delete a competitor's sign-in
     * identity (research R11). Without a tenant, a client and one credential, deletion stops the identity at the API
     * only.
     *
     * @param tenantId the competitor tenant's id
     * @param clientId the application allowed to delete users
     * @param clientSecret its secret; never logged. Used in preference to {@code federatedTokenFile}
     * @param federatedTokenFile the projected service-account token for AKS workload identity, used when no secret is
     *     set
     * @param authorityHost the sign-in host, default {@code https://login.microsoftonline.com/}
     * @param graphBaseUrl Graph's base address, default {@code https://graph.microsoft.com/v1.0}
     */
    public record CompetitorDirectory(
            String tenantId,
            String clientId,
            String clientSecret,
            String federatedTokenFile,
            String authorityHost,
            String graphBaseUrl) {
        public static final String DEFAULT_AUTHORITY_HOST = "https://login.microsoftonline.com/";
        public static final String DEFAULT_GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

        public CompetitorDirectory {
            tenantId = tenantId == null ? "" : tenantId.trim();
            clientId = clientId == null ? "" : clientId.trim();
            clientSecret = clientSecret == null ? "" : clientSecret;
            federatedTokenFile = federatedTokenFile == null ? "" : federatedTokenFile.trim();
            authorityHost =
                    authorityHost == null || authorityHost.isBlank() ? DEFAULT_AUTHORITY_HOST : authorityHost.trim();
            graphBaseUrl = graphBaseUrl == null || graphBaseUrl.isBlank()
                    ? DEFAULT_GRAPH_BASE_URL
                    : graphBaseUrl.trim().replaceAll("/+$", "");
        }

        /** Whether a client secret is set; otherwise the federated token file is the credential. */
        public boolean usesClientSecret() {
            return !clientSecret.isBlank();
        }

        /** Whether the tenant, the client and one credential are present. */
        public boolean configured() {
            return !tenantId.isEmpty() && !clientId.isEmpty() && (usesClientSecret() || !federatedTokenFile.isEmpty());
        }

        @Override
        public String toString() {
            return "CompetitorDirectory[tenantId=" + tenantId + ", clientId=" + clientId + ", federatedTokenFile="
                    + federatedTokenFile + ", authorityHost=" + authorityHost + ", graphBaseUrl=" + graphBaseUrl
                    + ", clientSecret=" + (clientSecret.isEmpty() ? "" : "***") + "]";
        }
    }

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

    /**
     * Stripe hosted Checkout (ADR-0013, ADR-0016). One account, two webhook endpoints: registration's and the shop's.
     *
     * @param secretKey API secret key; never logged
     * @param webhookSecret signing secret of registration's webhook endpoint; never logged
     * @param successUrlBase the site's origin, e.g. {@code https://bjjeire.com}: Checkout returns the payer to a page
     *     under it
     * @param shopWebhookSecret signing secret of the shop's webhook endpoint; never logged
     */
    public record Stripe(String secretKey, String webhookSecret, String successUrlBase, String shopWebhookSecret) {
        // One constructor only: with a second, configuration binding cannot choose and leaves every secret blank.
        public Stripe {
            secretKey = secretKey == null ? "" : secretKey.trim();
            webhookSecret = webhookSecret == null ? "" : webhookSecret.trim();
            shopWebhookSecret = shopWebhookSecret == null ? "" : shopWebhookSecret.trim();
            successUrlBase = successUrlBase == null || successUrlBase.isBlank()
                    ? "https://bjjeire.com"
                    : successUrlBase.trim().replaceAll("/+$", "");
        }

        @Override
        public String toString() {
            return "Stripe[successUrlBase=" + successUrlBase + ", secretKey=" + (secretKey.isEmpty() ? "" : "***")
                    + ", webhookSecret=" + (webhookSecret.isEmpty() ? "" : "***") + ", shopWebhookSecret="
                    + (shopWebhookSecret.isEmpty() ? "" : "***") + "]";
        }
    }

    /**
     * Sign-up mail (research R6). The SMTP server itself is Spring Boot's {@code spring.mail.*}.
     *
     * @param from sender address of every sign-up mail
     */
    public record Mail(String from) {
        public static final String DEFAULT_FROM = "no-reply@bjjeire.com";

        public Mail {
            from = from == null || from.isBlank() ? DEFAULT_FROM : from.trim();
        }
    }

    /**
     * Sign-up holds (FR-019).
     *
     * @param hold how long a place is kept while the competitor pays; Stripe's Checkout floor is 30 minutes
     * @param holdSweepInitialDelay delay before the first fallback sweep of lapsed holds
     * @param holdSweepInterval delay between sweeps
     */
    public record Registration(
            java.time.Duration hold, java.time.Duration holdSweepInitialDelay, java.time.Duration holdSweepInterval) {
        public Registration {
            hold = hold == null ? java.time.Duration.ofMinutes(30) : hold;
            holdSweepInitialDelay =
                    holdSweepInitialDelay == null ? java.time.Duration.ofMinutes(1) : holdSweepInitialDelay;
            holdSweepInterval = holdSweepInterval == null ? java.time.Duration.ofMinutes(1) : holdSweepInterval;
        }
    }

    /**
     * BJJ Éire merch orders (specs/003-bjjeire-merch-shop research R5, R7). A zero or negative value means the default.
     *
     * @param hold how long stock is kept while a guest pays (FR-011); Stripe's Checkout floor is 30 minutes
     * @param maxUnitsPerLine most units of one size in one order
     * @param maxUnitsPerOrder most units in one order
     * @param maxUnpaidPerEmail most unpaid orders at once for one email address
     * @param maxUnpaidPerIp most unpaid orders at once from one client address
     * @param lowStock a size with this many available or fewer is low on the dashboard (FR-025)
     */
    public record Order(
            java.time.Duration hold,
            int maxUnitsPerLine,
            int maxUnitsPerOrder,
            int maxUnpaidPerEmail,
            int maxUnpaidPerIp,
            int lowStock) {
        public Order {
            hold = hold == null ? java.time.Duration.ofMinutes(30) : hold;
            maxUnitsPerLine = maxUnitsPerLine <= 0 ? 10 : maxUnitsPerLine;
            maxUnitsPerOrder = maxUnitsPerOrder <= 0 ? 20 : maxUnitsPerOrder;
            maxUnpaidPerEmail = maxUnpaidPerEmail <= 0 ? 3 : maxUnpaidPerEmail;
            maxUnpaidPerIp = maxUnpaidPerIp <= 0 ? 3 : maxUnpaidPerIp;
            lowStock = lowStock <= 0 ? 5 : lowStock;
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
