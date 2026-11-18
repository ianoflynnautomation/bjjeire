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

    /** In-house competitions: set-up, public pages, results. */
    public static final String BJJEIRE_COMPETITION = "/api/v1/bjjeire-competition";
    /** The signed-in competitor's own profile. */
    public static final String COMPETITOR = "/api/v1/competitor";
    /** A competitor's sign-ups, and the payment webhook. */
    public static final String REGISTRATION = "/api/v1/registration";
    /** BJJ Éire merch: the catalogue, its photos and the organiser's product admin (ADR-0016). */
    public static final String PRODUCT = "/api/v1/product";
    /** BJJ Éire merch: guest orders, the shop's payment webhook and the organiser's order admin (ADR-0016). */
    public static final String ORDER = "/api/v1/order";
    /** Local development only: issues an organiser token (ADR-0014). Absent everywhere else. */
    public static final String LOCAL_SIGN_IN = "/api/v1/local-sign-in";
    /** Local development only: issues a competitor token for a typed email (ADR-0014). Absent everywhere else. */
    public static final String LOCAL_COMPETITOR_SIGN_IN = LOCAL_SIGN_IN + "/competitor";

    /** The one write with no bearer token; authenticated by Stripe's signature (ADR-0013). */
    public static final String STRIPE_WEBHOOK = REGISTRATION + "/stripe-webhook";

    /** The shop's own signed webhook, the second write with no bearer token (ADR-0016). */
    public static final String ORDER_STRIPE_WEBHOOK = ORDER + "/stripe-webhook";

    private static final String[] BJJEIRE_COMPETITION_FEATURE_PREFIXES = {BJJEIRE_COMPETITION, COMPETITOR, REGISTRATION
    };

    private static final String[] MERCH_FEATURE_PREFIXES = {PRODUCT, ORDER};

    private ApiRoutes() {}

    /**
     * Tells whether a request path belongs to the BJJ Éire competitions feature.
     *
     * <p>These paths are governed by the {@code BjjEireCompetitions} flag and are exempt from read-only mode
     * (ADR-0013). Adding a prefix here exempts it from read-only mode; removing one makes its writes answer 405 in
     * production.
     *
     * <p>The path is percent-decoded first, because Spring Security and Spring MVC match the decoded path: without that
     * {@code /api/v1/%62jjeire-competition} would slip past a check that the router then treats as
     * {@code /api/v1/bjjeire-competition}.
     *
     * @param requestUri the raw request URI, as {@code HttpServletRequest.getRequestURI()} returns it
     * @return true for a BJJ Éire competition, competitor or registration route
     */
    public static boolean isBjjEireCompetitionFeaturePath(String requestUri) {
        return startsWithAny(requestUri, BJJEIRE_COMPETITION_FEATURE_PREFIXES);
    }

    /**
     * Tells whether a request path belongs to the BJJ Éire merch shop.
     *
     * <p>These paths are governed by the {@code Merch} flag and are exempt from read-only mode (ADR-0016), under the
     * same rule as {@link #isBjjEireCompetitionFeaturePath}: the path is percent-decoded first.
     *
     * @param requestUri the raw request URI, as {@code HttpServletRequest.getRequestURI()} returns it
     * @return true for a product or order route
     */
    public static boolean isMerchFeaturePath(String requestUri) {
        return startsWithAny(requestUri, MERCH_FEATURE_PREFIXES);
    }

    private static boolean startsWithAny(String requestUri, String[] prefixes) {
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
        for (String prefix : prefixes) {
            if (path.equals(prefix) || path.startsWith(prefix + "/")) {
                return true;
            }
        }
        return false;
    }
}
