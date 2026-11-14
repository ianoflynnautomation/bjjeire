package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;

/** ADR-0014: an organiser token for local development, never trusted anywhere else. */
class LocalSignInTokensTest {
    private static final String SECRET = "local-development-only-0123456789abcdef";
    private static final Instant NOW = Instant.parse("2026-11-14T10:00:00Z");
    private static final Clock CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);

    @Test
    void shouldIssueAnOrganiserTokenThatTheLocalDecoderAccepts() {
        LocalSignInTokens.Issued issued = LocalSignInTokens.issue(SECRET, "access_as_writer", CLOCK);

        Jwt jwt = LocalSignInTokens.decoder(SECRET, CLOCK).decode(issued.accessToken());

        assertThat(jwt.getIssuer()).hasToString(LocalSignInTokens.ISSUER);
        assertThat(jwt.getSubject()).isEqualTo(LocalSignInTokens.SUBJECT);
        assertThat(jwt.getClaimAsString("scope")).isEqualTo("access_as_writer");
        assertThat(issued.expiresAt()).isEqualTo(NOW.plus(LocalSignInTokens.LIFETIME));
    }

    @Test
    void shouldRejectATokenSignedWithAnotherSecret() {
        String forged = LocalSignInTokens.issue("someone-elses-secret-0123456789abcdef", "access_as_writer", CLOCK)
                .accessToken();

        assertThatThrownBy(() -> LocalSignInTokens.decoder(SECRET, CLOCK).decode(forged))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void shouldRejectAnExpiredToken() {
        String token =
                LocalSignInTokens.issue(SECRET, "access_as_writer", CLOCK).accessToken();
        Clock later = Clock.offset(CLOCK, LocalSignInTokens.LIFETIME.plus(Duration.ofMinutes(2)));

        assertThatThrownBy(() -> LocalSignInTokens.decoder(SECRET, later).decode(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void shouldAllowLocalSignInOnlyUnderTheLocalProfileWithALongEnoughSecret() {
        assertThatCode(() -> LocalSignInTokens.requireSafe(
                        new BjjEireProperties.LocalSignIn(true, SECRET), profiles("local")))
                .doesNotThrowAnyException();

        assertThatThrownBy(() ->
                        LocalSignInTokens.requireSafe(new BjjEireProperties.LocalSignIn(true, SECRET), profiles()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("local");
        assertThatThrownBy(() -> LocalSignInTokens.requireSafe(
                        new BjjEireProperties.LocalSignIn(true, SECRET), profiles("prod")))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> LocalSignInTokens.requireSafe(
                        new BjjEireProperties.LocalSignIn(true, "too-short"), profiles("local")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32");
    }

    @Test
    void shouldAskNothingOfAnyProfileWhileLocalSignInIsOff() {
        assertThatCode(() -> LocalSignInTokens.requireSafe(new BjjEireProperties.LocalSignIn(false, ""), profiles()))
                .doesNotThrowAnyException();
    }

    private static MockEnvironment profiles(String... active) {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles(active);
        return environment;
    }
}
