package com.bjjeire.api.config;

import java.util.Set;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

/**
 * Refuses, with 401, competitor tokens issued before their account was deleted (#5012, research R11 fallback). The
 * directory may still hold the identity, because Graph is unreachable or not configured, so the old sessions are ended
 * here. A token issued after the deletion is the person signing up again, and starts a new, empty account.
 *
 * <p>Runs after the inner decoder has validated the token, and only for competitor issuers: a workforce token is never
 * looked up.
 */
public final class RevocationCheckingJwtDecoder implements JwtDecoder {
    private final JwtDecoder inner;
    private final Set<String> competitorIssuers;
    private final RevokedCompetitors revoked;

    public RevocationCheckingJwtDecoder(JwtDecoder inner, Set<String> competitorIssuers, RevokedCompetitors revoked) {
        this.inner = inner;
        this.competitorIssuers = Set.copyOf(competitorIssuers);
        this.revoked = revoked;
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        Jwt jwt = inner.decode(token);
        String issuer = jwt.getClaimAsString(JwtClaimNames.ISS);
        if (issuer != null
                && competitorIssuers.contains(issuer)
                && revoked.isRevoked(issuer, jwt.getSubject(), jwt.getIssuedAt())) {
            throw new BadJwtException("This competitor account has been deleted.");
        }
        return jwt;
    }
}
