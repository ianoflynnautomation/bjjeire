package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.PlainJWT;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

/** ADR-0012: the unverified issuer only chooses which decoder validates the token. */
class RoutingJwtDecoderTest {
    private static final String COMPETITOR_ISSUER = "https://competitors.ciamlogin.com/competitors/v2.0";

    private final JwtDecoder workforce = token -> decoded(token, "workforce");
    private final JwtDecoder competitor = token -> decoded(token, "competitor");
    private final RoutingJwtDecoder decoder = new RoutingJwtDecoder(workforce, competitor, COMPETITOR_ISSUER);

    /** ADR-0014: the local sign-in issuer is trusted only where local sign-in is switched on. */
    @Test
    void shouldSendLocalSignInTokensToTheLocalDecoderOnlyWhenLocalSignInIsConfigured() {
        JwtDecoder local = token -> decoded(token, "local");
        RoutingJwtDecoder withLocal = new RoutingJwtDecoder(workforce, competitor, COMPETITOR_ISSUER, local);

        assertThat(withLocal.decode(tokenIssuedBy(LocalSignInTokens.ISSUER)).getSubject())
                .isEqualTo("local");
        assertThat(withLocal.decode(tokenIssuedBy(COMPETITOR_ISSUER)).getSubject())
                .isEqualTo("competitor");
        // Without a local decoder the issuer means nothing: the workforce decoder sees it and rejects it.
        assertThat(decoder.decode(tokenIssuedBy(LocalSignInTokens.ISSUER)).getSubject())
                .isEqualTo("workforce");
    }

    @Test
    void shouldSendCompetitorIssuerTokensToTheCompetitorDecoder() {
        assertThat(decoder.decode(tokenIssuedBy(COMPETITOR_ISSUER)).getSubject())
                .isEqualTo("competitor");
    }

    @Test
    void shouldSendWorkforceIssuerTokensToTheDefaultDecoder() {
        assertThat(decoder.decode(tokenIssuedBy("https://login.microsoftonline.com/workforce/v2.0"))
                        .getSubject())
                .isEqualTo("workforce");
    }

    @Test
    void shouldSendTokensFromAnyOtherIssuerToTheWorkforceDecoder() {
        assertThat(decoder.decode(tokenIssuedBy("https://evil.example/v2.0")).getSubject())
                .isEqualTo("workforce");
    }

    @Test
    void shouldSendUnparseableTokensToTheDefaultDecoder() {
        assertThat(decoder.decode("not a token").getSubject()).isEqualTo("workforce");
    }

    @Test
    void shouldNeverRouteToTheCompetitorDecoderWhenNoCompetitorIssuerIsConfigured() {
        RoutingJwtDecoder noCompetitors = new RoutingJwtDecoder(workforce, competitor, "");

        assertThat(noCompetitors.decode(tokenIssuedBy("")).getSubject()).isEqualTo("workforce");
    }

    /** A competitor tenant that cannot be reached, or is misconfigured, is a bad token, not a server error. */
    @Test
    void shouldReportAnInvalidTokenWhenTheCompetitorDecoderCannotBeInitialised() {
        JwtDecoder unreachable = token -> {
            throw new IllegalStateException("discovery failed");
        };
        RoutingJwtDecoder routing = new RoutingJwtDecoder(workforce, unreachable, COMPETITOR_ISSUER);

        assertThatThrownBy(() -> routing.decode(tokenIssuedBy(COMPETITOR_ISSUER)))
                .isInstanceOf(BadJwtException.class);
    }

    /** After discovery has worked, a keys outage makes the decoder throw a plain JwtException, which would be a 500. */
    @Test
    void shouldReportAnInvalidTokenWhenTheCompetitorTenantFailsWhileValidating() {
        JwtDecoder keysUnavailable = token -> {
            throw new JwtException("An error occurred while attempting to decode the Jwt: keys unavailable");
        };
        RoutingJwtDecoder routing = new RoutingJwtDecoder(workforce, keysUnavailable, COMPETITOR_ISSUER);

        assertThatThrownBy(() -> routing.decode(tokenIssuedBy(COMPETITOR_ISSUER)))
                .isInstanceOf(BadJwtException.class);
    }

    /** ADR-0012: with the feature off, a token naming the competitor issuer never reaches the competitor tenant. */
    @Test
    void shouldSendCompetitorIssuerTokensToTheWorkforceDecoderWhileTheFeatureIsOff() {
        BjjEireProperties.CompetitorAuth auth =
                new BjjEireProperties.CompetitorAuth(COMPETITOR_ISSUER, List.of("api://x"), null);

        JwtDecoder off = SecurityConfig.routingDecoder(workforce, competitor, auth, false);
        JwtDecoder on = SecurityConfig.routingDecoder(workforce, competitor, auth, true);

        assertThat(off.decode(tokenIssuedBy(COMPETITOR_ISSUER)).getSubject()).isEqualTo("workforce");
        assertThat(on.decode(tokenIssuedBy(COMPETITOR_ISSUER)).getSubject()).isEqualTo("competitor");
    }

    private static String tokenIssuedBy(String issuer) {
        return new PlainJWT(
                        new JWTClaimsSet.Builder().issuer(issuer).subject("u").build())
                .serialize();
    }

    private static Jwt decoded(String token, String subject) {
        return Jwt.withTokenValue(token)
                .header("alg", "none")
                .claim("sub", subject)
                .build();
    }
}
