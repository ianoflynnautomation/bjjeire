package com.bjjeire.api.web;

import com.bjjeire.api.common.ApiRoutes;
import tools.jackson.databind.ObjectMapper;

/**
 * Answers 404 for every BJJ Éire competition, competitor and registration route while the {@code BjjEireCompetitions}
 * flag is off (ADR-0013).
 *
 * <p>Not a component: {@code SecurityConfig} places it ahead of authentication, so a switched-off feature looks absent
 * to every caller instead of asking for a token.
 */
public final class BjjEireCompetitionFeatureGateFilter extends FeatureGateFilter {
    static final String DETAIL = "The BJJ Éire competitions feature is not available.";

    public BjjEireCompetitionFeatureGateFilter(FeatureFlagService featureFlags, ObjectMapper objectMapper) {
        super(
                featureFlags,
                objectMapper,
                FeatureFlag.BJJEIRE_COMPETITIONS,
                ApiRoutes::isBjjEireCompetitionFeaturePath,
                DETAIL);
    }
}
