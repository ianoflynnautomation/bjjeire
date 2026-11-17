package com.bjjeire.api.bjjeirecompetition;

/**
 * A confirmed competitor the organiser can choose as a medallist. Admin only: carries the sign-up id.
 *
 * @param academy null for no academy
 * @param affiliation null for none
 */
public record ResultCompetitorDto(String registrationId, String displayName, String academy, String affiliation) {}
