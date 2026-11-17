package com.bjjeire.api.bjjeirecompetition;

import java.util.List;

/**
 * One division on the organiser's results tab. Admin only.
 *
 * @param result null until a podium is recorded
 * @param competitors the division's confirmed competitors, by name: the only choices for a medal
 */
public record AdminDivisionResultDto(
        String divisionId, DivisionResultDto result, List<ResultCompetitorDto> competitors) {}
