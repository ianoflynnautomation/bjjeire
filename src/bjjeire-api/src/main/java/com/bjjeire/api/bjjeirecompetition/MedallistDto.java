package com.bjjeire.api.bjjeirecompetition;

/**
 * A medallist on a public podium: name, academy and affiliation only (FR-011).
 *
 * @param academy null for no academy
 * @param affiliation null for none
 */
public record MedallistDto(String displayName, String academy, String affiliation) {}
