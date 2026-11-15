package com.bjjeire.api.common;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public final class ApiRoutes {
    public static final String BJJ_EVENT = "/api/v1/bjjevent";
    public static final String COMPETITION = "/api/v1/competition";
    public static final String DONATE = "/api/v1/donate";
    public static final String FEATURE_FLAG = "/api/v1/featureflag";
    public static final String GYM = "/api/v1/gym";
    public static final String STORE = "/api/v1/store";

    /** In-house tournaments: set-up, public pages, results. */
    public static final String TOURNAMENT = "/api/v1/tournament";
    /** The signed-in competitor's own profile. */
    public static final String COMPETITOR = "/api/v1/competitor";
    /** A competitor's sign-ups, and the payment webhook. */
    public static final String REGISTRATION = "/api/v1/registration";
    /** Local development only: issues an organiser token (ADR-0014). Absent everywhere else. */
    public static final String LOCAL_SIGN_IN = "/api/v1/local-sign-in";

    /** The one write with no bearer token; authenticated by Stripe's signature (ADR-0013). */
    public static final String STRIPE_WEBHOOK = REGISTRATION + "/stripe-webhook";

    private static final String[] TOURNAMENT_FEATURE_PREFIXES = {TOURNAMENT, COMPETITOR, REGISTRATION};

    private ApiRoutes() {}

    /**
     * Tells whether a request path belongs to the tournament feature.
     *
     * <p>These paths are governed by the {@code Tournaments} flag and are exempt from read-only mode (ADR-0013). Adding
     * a prefix here exempts it from read-only mode; removing one makes its writes answer 405 in production.
     *
     * <p>The path is percent-decoded first, because Spring Security and Spring MVC match the decoded path: without that
     * {@code /api/v1/%74ournament} would slip past a check that the router then treats as {@code /api/v1/tournament}.
     *
     * @param requestUri the raw request URI, as {@code HttpServletRequest.getRequestURI()} returns it
     * @return true for a tournament, competitor or registration route
     */
    public static boolean isTournamentFeaturePath(String requestUri) {
        if (requestUri == null) {
            return false;
        }
        String path;
        try {
            path = URLDecoder.decode(requestUri.replace("+", "%2B"), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException malformedEncoding) {
            // The container rejects it before any handler runs. Treat it as ours so no rule is skipped.
            return true;
        }
        for (String prefix : TOURNAMENT_FEATURE_PREFIXES) {
            if (path.equals(prefix) || path.startsWith(prefix + "/")) {
                return true;
            }
        }
        return false;
    }
}
