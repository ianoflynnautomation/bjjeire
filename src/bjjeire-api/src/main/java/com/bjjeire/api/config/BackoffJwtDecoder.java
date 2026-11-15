package com.bjjeire.api.config;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.function.Supplier;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

/**
 * Builds a decoder on first use and backs off after a failed build (ADR-0012).
 *
 * <p>Building the competitor decoder means an outbound discovery call. It must not run at start-up, where an
 * unreachable tenant would stop the API, and it must not run again on every request while the tenant is down, where
 * anyone able to send a token naming that issuer could tie up request threads. While the back-off lasts, tokens are
 * refused as invalid without another call.
 */
final class BackoffJwtDecoder implements JwtDecoder {
    private final Supplier<JwtDecoder> factory;
    private final Duration backoff;
    private final Clock clock;
    private final Object lock = new Object();

    private volatile JwtDecoder delegate;
    private volatile Instant retryNotBefore = Instant.MIN;

    BackoffJwtDecoder(Supplier<JwtDecoder> factory, Duration backoff, Clock clock) {
        this.factory = factory;
        this.backoff = backoff;
        this.clock = clock;
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        return delegate().decode(token);
    }

    private JwtDecoder delegate() {
        JwtDecoder current = delegate;
        if (current != null) {
            return current;
        }
        synchronized (lock) {
            if (delegate != null) {
                return delegate;
            }
            if (clock.instant().isBefore(retryNotBefore)) {
                throw new BadJwtException("The token issuer is not available.");
            }
            try {
                delegate = factory.get();
                return delegate;
            } catch (RuntimeException unavailable) {
                retryNotBefore = clock.instant().plus(backoff);
                throw new BadJwtException("The token issuer is not available.", unavailable);
            }
        }
    }
}
