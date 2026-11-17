package com.bjjeire.api.bjjeirecompetition;

import java.util.List;

/**
 * The top academy and affiliation of a finished competition (FR-040).
 *
 * @param academies more than one when level on every tie-break; empty when nobody earned points
 * @param affiliations likewise
 */
public record WinnersDto(List<String> academies, List<String> affiliations) {}
