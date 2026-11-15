package com.bjjeire.api.config;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.core.env.Environment;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/**
 * Organiser tokens for local development, so the admin screens work without a real Entra tenant (ADR-0014).
 *
 * <p>Trusted only while {@code bjjeire.local-sign-in.enabled} is true, and {@link #requireSafe} refuses to let the API
 * start that way unless the {@code local} profile is active. A local token carries the writer scope and goes through
 * the same authorization rules as a workforce token; it is never a competitor.
 */
public final class LocalSignInTokens {
    /**
     * Issuer of every local token. Spring reads {@code iss} as a URL; {@code .invalid} is reserved (RFC 2606) and never
     * resolves, so this can never be a real tenant.
     */
    public static final String ISSUER = "https://local-sign-in.bjjeire.invalid";

    /**
     * Issuer of local competitor tokens (ADR-0014, slice 2). Mapped like the competitor tenant: the competitor role and
     * nothing else.
     */
    public static final String COMPETITOR_ISSUER = "https://local-competitor-sign-in.bjjeire.invalid";

    public static final String SUBJECT = "local-organiser";

    /**
     * Prefix of a local competitor's subject. The rest is the SHA-256 of their lower-cased email: the same email is the
     * same person, and no email is stored in the deleted-account record or the audit log.
     */
    public static final String COMPETITOR_SUBJECT_PREFIX = "local-competitor:";

    public static final Duration LIFETIME = Duration.ofHours(8);
    public static final String REQUIRED_PROFILE = "local";

    /** HS256 needs a key of at least 256 bits. */
    public static final int MIN_SECRET_BYTES = 32;

    private static final Duration CLOCK_SKEW = Duration.ofSeconds(60);

    private LocalSignInTokens() {}

    /**
     * A token and when it stops working.
     *
     * @param accessToken the bearer value
     * @param expiresAt its expiry
     */
    public record Issued(String accessToken, Instant expiresAt) {}

    /**
     * Fails startup when local sign-in is switched on anywhere but local development.
     *
     * @param settings the configured local sign-in
     * @param environment the running profiles
     * @throws IllegalStateException when it is on with any profile set but {@code local} alone, or with a short secret
     */
    public static void requireSafe(BjjEireProperties.LocalSignIn settings, Environment environment) {
        if (!settings.enabled()) {
            return;
        }
        // 'local' must be the only active profile: next to a deployed one it would take two mistakes, not one.
        if (!Arrays.equals(environment.getActiveProfiles(), new String[] {REQUIRED_PROFILE})) {
            throw new IllegalStateException("bjjeire.local-sign-in.enabled is true, but the active profiles are "
                    + Arrays.toString(environment.getActiveProfiles()) + ". It needs '" + REQUIRED_PROFILE
                    + "' as the only active profile. Local sign-in issues organiser tokens to anyone and must never"
                    + " run outside local development.");
        }
        if (settings.secret().getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "bjjeire.local-sign-in.secret must be at least " + MIN_SECRET_BYTES + " bytes.");
        }
    }

    /**
     * Issues an organiser token.
     *
     * @param secret the shared signing secret
     * @param writerScope the scope the workforce mapping turns into the writer authority
     * @param clock source of the issue time
     * @return the signed token
     */
    public static Issued issue(String secret, String writerScope, Clock clock) {
        Instant now = clock.instant();
        Instant expiresAt = now.plus(LIFETIME);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(SUBJECT)
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("scope", writerScope)
                .build();
        return new Issued(sign(secret, claims), expiresAt);
    }

    private static String sha256Hex(String value) {
        try {
            return java.util.HexFormat.of()
                    .formatHex(java.security.MessageDigest.getInstance("SHA-256")
                            .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is required by every JDK", impossible);
        }
    }

    private static String sign(String secret, JwtClaimsSet claims) {
        return NimbusJwtEncoder.withSecretKey(key(secret))
                .build()
                .encode(JwtEncoderParameters.from(
                        JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    /**
     * Issues a competitor token for the person who typed {@code email}.
     *
     * @param secret the shared signing secret
     * @param competitorScope the scope the competitor mapping requires
     * @param email identifies the local competitor; compared without case or outer spaces
     * @param clock source of the issue time
     * @return the signed token
     */
    public static Issued issueCompetitor(String secret, String competitorScope, String email, Clock clock) {
        Instant now = clock.instant();
        Instant expiresAt = now.plus(LIFETIME);
        String normalised = email.trim().toLowerCase(java.util.Locale.ROOT);
        String subject = COMPETITOR_SUBJECT_PREFIX + sha256Hex(normalised);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(COMPETITOR_ISSUER)
                .subject(subject)
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("scope", competitorScope)
                .claim("email", normalised)
                .claim("oid", subject)
                .build();
        return new Issued(sign(secret, claims), expiresAt);
    }

    /**
     * Builds the decoder that validates local tokens: signature, issuer, and expiry against {@code clock}.
     *
     * @param secret the shared signing secret
     * @param clock source of the current time
     * @return the decoder
     */
    public static JwtDecoder decoder(String secret, Clock clock) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key(secret))
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        JwtTimestampValidator timestamps = new JwtTimestampValidator(CLOCK_SKEW);
        timestamps.setClock(clock);
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                timestamps,
                new JwtClaimValidator<Object>(
                        JwtClaimNames.ISS,
                        issuer -> issuer != null
                                && (ISSUER.equals(issuer.toString()) || COMPETITOR_ISSUER.equals(issuer.toString())))));
        return decoder;
    }

    private static SecretKey key(String secret) {
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }
}
