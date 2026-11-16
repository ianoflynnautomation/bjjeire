package com.bjjeire.api.tournament;

import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import java.util.Optional;

/** Use cases for tournament set-up and the public tournament pages. */
public interface TournamentService {
    /**
     * Lists the tournaments visitors may see, earliest day first.
     *
     * @param paginationRequest page and page size
     * @param basePath path used to build page links
     * @return published, finished and cancelled tournaments; never a draft
     */
    PagedResponse<TournamentSummaryDto> getPublished(PaginationRequest paginationRequest, String basePath);

    /**
     * Returns one tournament by its public slug.
     *
     * @param slug the slug in the page address
     * @return the tournament, or empty when there is none or it is still a draft
     */
    Optional<TournamentDto> getPublishedBySlug(String slug);

    /**
     * Lists every tournament, drafts included, latest day first.
     *
     * @param paginationRequest page and page size
     * @param basePath path used to build page links
     * @return the page
     */
    PagedResponse<TournamentSummaryDto> getAllForAdmin(PaginationRequest paginationRequest, String basePath);

    /**
     * Returns one tournament in any status.
     *
     * @param id tournament id
     * @return the tournament, or empty when the id is unknown
     */
    Optional<TournamentDto> getForAdmin(String id);

    /**
     * Stores a new tournament as a draft.
     *
     * @param command the organiser's details and divisions
     * @return the draft
     * @throws org.springframework.web.server.ResponseStatusException 409 when the slug is taken, 400 when a division is
     *     repeated
     */
    TournamentDto create(CreateTournamentCommand command);

    /**
     * Replaces the details and the division list of a draft or published tournament.
     *
     * @param id tournament id
     * @param command the full details; a division left out is removed
     * @return the updated tournament, or empty when the id is unknown
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code division-has-signups} when a removed
     *     division still has active sign-ups; 409 when the tournament is finished or cancelled, or would stop being
     *     publishable
     */
    Optional<TournamentDto> update(String id, UpdateTournamentCommand command);

    /**
     * Makes a draft visible to the public.
     *
     * @param id tournament id
     * @return the published tournament, or empty when the id is unknown
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code no-divisions}, {@code invalid-window},
     *     or when it is not a draft
     */
    Optional<TournamentDto> publish(String id);

    /**
     * Returns a tournament the public may see, read fresh from the database, with its registration state worked out for
     * now. For sign-ups, which must not act on a cached place count.
     *
     * @param id tournament id
     * @return the tournament, or empty when the id is unknown or it is a draft
     */
    Optional<TournamentDto> getPublicById(String id);

    /**
     * Takes one place, atomically: only while the tournament is published and below its competitor limit (FR-022).
     *
     * @param id tournament id
     * @return true when a place was taken; false when it is full or no longer published
     */
    boolean takePlace(String id);

    /**
     * Gives one place back. Never takes the count below zero.
     *
     * @param id tournament id
     */
    void releasePlace(String id);

    /**
     * Cancels a draft or published tournament. Asking again for a cancelled one returns it unchanged, so a refund run
     * that stopped part way can be resumed (FR-029).
     *
     * @param id tournament id
     * @return the cancelled tournament, or empty when the id is unknown
     * @throws org.springframework.web.server.ResponseStatusException 409 when it is finished
     */
    Optional<TournamentDto> cancel(String id);
}
