package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

/** Research R11 fallback: a deleted competitor's tokens stop working even while the directory still has them. */
class RevocationCheckingJwtDecoderTest {
    private static final String COMPETITOR_ISSUER = "https://competitors.ciamlogin.com/competitors/v2.0";
    private static final String WORKFORCE_ISSUER = "https://login.microsoftonline.com/workforce/v2.0";

    private static final Instant DELETED_AT = Instant.parse("2026-11-15T10:00:00Z");

    /** "deleted" was deleted at DELETED_AT: tokens issued before then, or with no issue time, are refused. */
    private final RevokedCompetitors revoked = (issuer, subject, issuedAt) -> COMPETITOR_ISSUER.equals(issuer)
            && "deleted".equals(subject)
            && (issuedAt == null || issuedAt.isBefore(DELETED_AT));

    @Test
    @Tag("#5012")
    void shouldRejectATokenOfADeletedCompetitor() {
        JwtDecoder decoder = decoder(COMPETITOR_ISSUER, "deleted");

        assertThatThrownBy(() -> decoder.decode("t")).isInstanceOf(BadJwtException.class);
    }

    /** A sign-in after the deletion is the person signing up again, not the deleted account. */
    @Test
    @Tag("#5012")
    void shouldAcceptATokenIssuedAfterTheDeletion() {
        assertThat(decoder(COMPETITOR_ISSUER, "deleted", DELETED_AT.plusSeconds(5))
                        .decode("t")
                        .getSubject())
                .isEqualTo("deleted");
        assertThatThrownBy(() -> decoder(COMPETITOR_ISSUER, "deleted", DELETED_AT.minusSeconds(5))
                        .decode("t"))
                .isInstanceOf(BadJwtException.class);
    }

    @Test
    void shouldPassEveryOtherTokenThrough() {
        assertThat(decoder(COMPETITOR_ISSUER, "still-here").decode("t").getSubject())
                .isEqualTo("still-here");
        // Revocation is for competitor issuers only; a workforce subject is never looked up.
        assertThat(decoder(WORKFORCE_ISSUER, "deleted").decode("t").getSubject())
                .isEqualTo("deleted");
    }

    private RevocationCheckingJwtDecoder decoder(String issuer, String subject) {
        return decoder(issuer, subject, null);
    }

    private RevocationCheckingJwtDecoder decoder(String issuer, String subject, Instant issuedAt) {
        JwtDecoder inner = token -> Jwt.withTokenValue(token)
                .header("alg", "none")
                .claim("iss", issuer)
                .claim("sub", subject)
                .claims(claims -> {
                    if (issuedAt != null) {
                        claims.put("iat", issuedAt);
                    }
                })
                .build();
        return new RevocationCheckingJwtDecoder(inner, Set.of(COMPETITOR_ISSUER), revoked);
    }
}
