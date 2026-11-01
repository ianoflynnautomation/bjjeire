package com.bjjeire.api.web;

import java.util.Map;

/**
 * Evaluates catalogue feature flags.
 *
 * <p>The implementation is the vendor boundary. Callers depend on this type, not on configuration properties. Today the
 * flags are read from in-memory configuration. Swapping the vendor means replacing the implementation; controllers and
 * feature services keep this contract.
 *
 * <p>Evaluation is local. Resolved booleans are fixed when the bean is created, so a request does not call a remote
 * flag service.
 */
public interface FeatureFlagService {
    /**
     * Evaluates one flag.
     *
     * <p>Current flags are global environment toggles, so {@code context} does not change the result. A missing flag is
     * off.
     *
     * @param flag catalogue flag
     * @param context who the flag is evaluated for; never logged
     * @return {@code true} when the flag is on
     */
    boolean isEnabled(FeatureFlag flag, FeatureFlagContext context);

    /**
     * Returns the anonymous snapshot for {@code GET /api/v1/featureflag}.
     *
     * <p>The snapshot is not personalised. The public response stays free of a subject key so it can be cached and
     * cannot carry an identifier.
     *
     * @return wire name to boolean, in catalogue order; unmodifiable
     */
    Map<String, Boolean> frontendFlags();
}
