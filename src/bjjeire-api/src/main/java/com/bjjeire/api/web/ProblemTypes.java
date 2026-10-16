package com.bjjeire.api.web;

import java.net.URI;

/** Problem type URIs for every API error. One family, so clients can match on `type`. */
public final class ProblemTypes {
    public static final URI BAD_REQUEST = URI.create("urn:bjjeire:bad-request");
    public static final URI UNAUTHORIZED = URI.create("urn:bjjeire:unauthorized");
    public static final URI FORBIDDEN = URI.create("urn:bjjeire:forbidden");
    public static final URI NOT_FOUND = URI.create("urn:bjjeire:not-found");
    public static final URI METHOD_NOT_ALLOWED = URI.create("urn:bjjeire:method-not-allowed");
    public static final URI CONFLICT = URI.create("urn:bjjeire:conflict");
    public static final URI VALIDATION = URI.create("urn:bjjeire:validation-error");
    public static final URI RATE_LIMIT = URI.create("urn:bjjeire:rate-limit-exceeded");
    public static final URI INTERNAL = URI.create("urn:bjjeire:internal-error");

    private ProblemTypes() {}
}
