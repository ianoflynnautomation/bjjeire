package com.bjjeire.api.registration;

import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;

/** The organiser's sign-up tools (FR-006, FR-007). */
public interface RegistrationAdminService {
    /**
     * Every sign-up of a competition in any status, oldest first, with the competitor's private details.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 for an unknown competition
     */
    PagedResponse<AdminRegistrationDto> list(String competitionId, PaginationRequest paginationRequest);

    /**
     * The same rows as {@link #list}, all of them, as CSV with a header row (RFC 4180).
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 for an unknown competition
     */
    String exportCsv(String competitionId);

    /**
     * Moves a confirmed sign-up to any division of its competition, open or closed, with no eligibility check.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 when the sign-up or division is not in this
     *     competition; 409 {@code already-registered}, or when it is not confirmed
     */
    AdminRegistrationDto move(String competitionId, String registrationId, ChangeDivisionCommand command);

    /**
     * Rewrites the academy or affiliation of every sign-up of this competition whose key is one of {@code fromKeys}.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 for an unknown competition; 400 for a gym on
     *     an affiliation merge or a gym not in the directory
     */
    TeamMergeDto mergeTeams(String competitionId, MergeTeamsCommand command);
}
