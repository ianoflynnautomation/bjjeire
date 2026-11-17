package com.bjjeire.api.bjjeirecompetition;

/**
 * One academy or affiliation in a ranking (FR-033, FR-034).
 *
 * @param rank 1 for the top; entries level on points, golds, silvers and bronzes share a rank
 * @param name as the first of its medallists typed it
 */
public record TeamStandingDto(int rank, String name, int points, int gold, int silver, int bronze) {}
