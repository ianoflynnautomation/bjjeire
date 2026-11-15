package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;

/** ADR-0012: a competitor token must be issued by the competitor tenant for this API. */
class CompetitorTokenValidatorTest {
    private static final String ISSUER = "https://competitors.ciamlogin.com/competitors/v2.0";
    private static final String AUDIENCE = "api://bjjeire-competitor-api";

    private final OAuth2TokenValidator<Jwt> validator = SecurityConfig.competitorTokenValidator(
            new BjjEireProperties.CompetitorAuth(ISSUER, List.of(AUDIENCE, "client-id-guid"), null));

    @Test
    void shouldAcceptATokenForAnyConfiguredAudience() {
        assertThat(validator.validate(token(ISSUER, List.of(AUDIENCE))).hasErrors())
                .isFalse();
        assertThat(validator
                        .validate(token(ISSUER, List.of("other", "client-id-guid")))
                        .hasErrors())
                .isFalse();
    }

    @Test
    void shouldRejectATokenForAnotherAudience() {
        assertThat(validator
                        .validate(token(ISSUER, List.of("api://someone-else")))
                        .hasErrors())
                .isTrue();
    }

    @Test
    void shouldRejectATokenWithNoAudience() {
        assertThat(validator.validate(token(ISSUER, null)).hasErrors()).isTrue();
    }

    @Test
    void shouldRejectATokenFromAnotherIssuer() {
        assertThat(validator
                        .validate(token("https://evil.example/v2.0", List.of(AUDIENCE)))
                        .hasErrors())
                .isTrue();
    }

    @Test
    void shouldRejectEveryTokenWhenNoAudienceIsConfigured() {
        OAuth2TokenValidator<Jwt> noAudiences =
                SecurityConfig.competitorTokenValidator(new BjjEireProperties.CompetitorAuth(ISSUER, List.of(), null));

        assertThat(noAudiences.validate(token(ISSUER, List.of(AUDIENCE))).hasErrors())
                .isTrue();
    }

    private static Jwt token(String issuer, List<String> audience) {
        Instant now = Instant.now();
        Jwt.Builder builder = Jwt.withTokenValue("t")
                .header("alg", "none")
                .claim("sub", "u")
                .claim("iss", issuer)
                .issuedAt(now.minusSeconds(10))
                .expiresAt(now.plusSeconds(300));
        if (audience != null) {
            builder.audience(audience);
        }
        return builder.build();
    }
}
