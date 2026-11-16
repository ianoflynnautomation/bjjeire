package com.bjjeire.api.registration;

/**
 * A competitor on a public list: name, academy and affiliation only (FR-011).
 *
 * @param academy null for "no academy"
 * @param affiliation null for none
 */
public record ListedCompetitorDto(String displayName, String academy, String affiliation) {}
