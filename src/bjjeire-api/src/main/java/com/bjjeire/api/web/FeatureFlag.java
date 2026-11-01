package com.bjjeire.api.web;

/**
 * Catalogue flags served to the SPA.
 *
 * <p>The wire name is the JSON key of {@code GET /api/v1/featureflag}. Renaming one is a breaking API change. Removing
 * one is a delete here and in the SPA catalogue.
 */
public enum FeatureFlag {
    /** Public events directory. */
    BJJ_EVENTS("BjjEvents"),
    /** Public gym directory. */
    GYMS("Gyms"),
    /** Public competitions directory. */
    COMPETITIONS("Competitions"),
    /** Public stores directory. */
    STORES("Stores");

    private final String wireName;

    FeatureFlag(String wireName) {
        this.wireName = wireName;
    }

    /**
     * Returns the PascalCase contract name.
     *
     * @return JSON key
     */
    public String wireName() {
        return wireName;
    }
}
