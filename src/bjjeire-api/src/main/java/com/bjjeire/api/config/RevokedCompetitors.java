package com.bjjeire.api.config;

import java.time.Instant;

/**
 * Tells whether a competitor token belongs to an account that has since been deleted (research R11). A deletion ends
 * the sessions that existed then; a sign-in after it is the person signing up again and is not refused. Implemented by
 * the {@code competitor} package, so security configuration does not depend on it.
 */
@FunctionalInterface
public interface RevokedCompetitors {
    /**
     * @param issuer token issuer
     * @param subject token subject
     * @param issuedAt the token's {@code iat}, or null when it has none (refused if the identity was ever deleted)
     * @return true when the identity's account was deleted after this token was issued
     */
    boolean isRevoked(String issuer, String subject, Instant issuedAt);
}
