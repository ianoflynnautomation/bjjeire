package com.bjjeire.api.competitor;

import java.time.Instant;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;

/**
 * Who is calling, read from the validated competitor token (ADR-0012).
 *
 * @param issuer and {@code subject} identify the person
 * @param email the token's {@code email} claim, or null when the tenant does not send one
 * @param objectId the token's {@code oid} claim: the user's id in the directory, which Graph needs to delete them. The
 *     {@code sub} claim cannot be used for that: Entra issues a different one per application
 * @param issuedAt the token's {@code iat}: a deletion ends only the sessions issued before it
 */
public record CompetitorIdentity(String issuer, String subject, String email, String objectId, Instant issuedAt) {
    /** An identity whose token carries no issue time. */
    public CompetitorIdentity(String issuer, String subject, String email, String objectId) {
        this(issuer, subject, email, objectId, null);
    }

    static final String EMAIL_CLAIM = "email";
    static final String OBJECT_ID_CLAIM = "oid";

    /** Reads the identity from a token that Spring Security has already validated. */
    public static CompetitorIdentity from(Jwt jwt) {
        String email = jwt.getClaimAsString(EMAIL_CLAIM);
        return new CompetitorIdentity(
                jwt.getClaimAsString(JwtClaimNames.ISS),
                jwt.getSubject(),
                email == null || email.isBlank() ? null : email.trim(),
                jwt.getClaimAsString(OBJECT_ID_CLAIM),
                jwt.getIssuedAt());
    }
}
