package com.bjjeire.api.registration;

import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;

/** The organiser's sign-up tools (FR-006, FR-007). */
public interface RegistrationAdminService {
    /**
     * Every sign-up of a tournament in any status, oldest first, with the competitor's private details.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 for an unknown tournament
     */
    PagedResponse<AdminRegistrationDto> list(String tournamentId, PaginationRequest paginationRequest);

    /**
     * The same rows as {@link #list}, all of them, as CSV with a header row (RFC 4180).
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 for an unknown tournament
     */
    String exportCsv(String tournamentId);

    /**
     * Moves a confirmed sign-up to any division of its tournament, open or closed, with no eligibility check.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 when the sign-up or division is not in this
     *     tournament; 409 {@code already-registered}, or when it is not confirmed
     */
    AdminRegistrationDto move(String tournamentId, String registrationId, ChangeDivisionCommand command);

    /**
     * Rewrites the academy or affiliation of every sign-up of this tournament whose key is one of {@code fromKeys}.
     *
     * @throws org.springframework.web.server.ResponseStatusException 404 for an unknown tournament; 400 for a gym on an
     *     affiliation merge or a gym not in the directory
     */
    TeamMergeDto mergeTeams(String tournamentId, MergeTeamsCommand command);
}
