package com.bjjeire.api.common;

/**
 * Central registry of public API route paths. Controllers expose each route in PascalCase and lowercase; both spellings
 * must stay registered here so {@code SecurityConfig} and the controllers never drift apart.
 */
public final class ApiRoutes {
    public static final String BJJ_EVENT = "/api/v1/BjjEvent";
    public static final String BJJ_EVENT_LOWERCASE = "/api/v1/bjjevent";
    public static final String COMPETITION = "/api/v1/Competition";
    public static final String COMPETITION_LOWERCASE = "/api/v1/competition";
    public static final String DONATE = "/api/v1/Donate";
    public static final String DONATE_LOWERCASE = "/api/v1/donate";
    public static final String FEATURE_FLAG = "/api/v1/FeatureFlag";
    public static final String FEATURE_FLAG_LOWERCASE = "/api/v1/featureflag";
    public static final String GYM = "/api/v1/Gym";
    public static final String GYM_LOWERCASE = "/api/v1/gym";
    public static final String STORE = "/api/v1/Store";
    public static final String STORE_LOWERCASE = "/api/v1/store";

    private ApiRoutes() {}
}
