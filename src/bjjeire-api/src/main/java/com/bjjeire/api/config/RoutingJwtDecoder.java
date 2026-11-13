package com.bjjeire.api.config;

import com.nimbusds.jwt.JWTParser;
import java.text.ParseException;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

/**
 * Chooses the decoder for a bearer token from its issuer (ADR-0012).
 *
 * <p>The issuer is read before the signature is checked, and is used for nothing but this choice: the chosen decoder
 * validates signature, issuer and audience for its own tenant. A token that cannot be parsed, or that names any issuer
 * other than the competitor tenant, goes to the workforce decoder, which rejects what it does not recognise.
 */
public final class RoutingJwtDecoder implements JwtDecoder {
    private final JwtDecoder workforce;
    private final JwtDecoder competitor;
    private final String competitorIssuer;

    public RoutingJwtDecoder(JwtDecoder workforce, JwtDecoder competitor, String competitorIssuer) {
        this.workforce = workforce;
        this.competitor = competitor;
        this.competitorIssuer = competitorIssuer == null ? "" : competitorIssuer.trim();
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        if (!isFromCompetitorIssuer(token)) {
            return workforce.decode(token);
        }
        try {
            return competitor.decode(token);
        } catch (BadJwtException invalid) {
            throw invalid;
        } catch (RuntimeException unavailable) {
            // Discovery or a keys fetch against the competitor tenant failed. Spring Security turns any
            // JwtException that is not a BadJwtException into a 500. The caller presented a token this API
            // cannot validate: that is a 401, and must never be a server error an anonymous caller can provoke.
            throw new BadJwtException("The competitor token could not be validated.", unavailable);
        }
    }

    private boolean isFromCompetitorIssuer(String token) {
        if (competitorIssuer.isEmpty()) {
            return false;
        }
        try {
            return competitorIssuer.equals(
                    JWTParser.parse(token).getJWTClaimsSet().getIssuer());
        } catch (ParseException | RuntimeException unparseable) {
            return false;
        }
    }
}
