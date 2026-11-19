package com.bjjeire.api.web;

import com.bjjeire.api.common.ApiRoutes;
import tools.jackson.databind.ObjectMapper;

/**
 * Answers 404 for every product and order route while the {@code Merch} flag is off (ADR-0016), so the shop's routes
 * are absent until merch is launched. The store directory is not a merch route and is governed by {@code Stores}.
 *
 * <p>Not a component: {@code SecurityConfig} places it ahead of authentication.
 */
public final class MerchFeatureGateFilter extends FeatureGateFilter {
    static final String DETAIL = "The BJJ Éire merch shop is not available.";

    public MerchFeatureGateFilter(FeatureFlagService featureFlags, ObjectMapper objectMapper) {
        super(featureFlags, objectMapper, FeatureFlag.MERCH, ApiRoutes::isMerchFeaturePath, DETAIL);
    }
}
