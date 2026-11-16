package com.bjjeire.api.registration;

import java.util.List;

/**
 * The confirmed competitors of one division, as the public sees them (FR-011).
 *
 * @param competitors ordered by name; empty when nobody is confirmed yet
 */
public record DivisionCompetitorsDto(String divisionId, List<ListedCompetitorDto> competitors) {}
