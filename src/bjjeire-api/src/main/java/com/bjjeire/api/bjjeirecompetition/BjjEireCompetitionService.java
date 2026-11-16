package com.bjjeire.api.bjjeirecompetition;

import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import java.util.Optional;

/** Use cases for competition set-up and the public competition pages. */
public interface BjjEireCompetitionService {
    /**
     * Lists the upcoming competitions featured on the Competitions page, earliest day then name (#3006, research R3).
     *
     * @param paginationRequest page and page size
     * @param basePath path used to build page links
     * @return published competitions whose day has not passed in Ireland; never a draft, finished or cancelled one
     */
    PagedResponse<BjjEireCompetitionSummaryDto> getUpcoming(PaginationRequest paginationRequest, String basePath);

    /**
     * Returns one competition by its public slug.
     *
     * @param slug the slug in the page address
     * @return the competition, or empty when there is none or it is still a draft
     */
    Optional<BjjEireCompetitionDto> getPublishedBySlug(String slug);

    /**
     * Lists every competition, drafts included, latest day first.
     *
     * @param paginationRequest page and page size
     * @param basePath path used to build page links
     * @return the page
     */
    PagedResponse<BjjEireCompetitionSummaryDto> getAllForAdmin(PaginationRequest paginationRequest, String basePath);

    /**
     * Returns one competition in any status.
     *
     * @param id competition id
     * @return the competition, or empty when the id is unknown
     */
    Optional<BjjEireCompetitionDto> getForAdmin(String id);

    /**
     * Stores a new competition as a draft.
     *
     * @param command the organiser's details and divisions
     * @return the draft
     * @throws org.springframework.web.server.ResponseStatusException 409 when the slug is taken, 400 when a division is
     *     repeated
     */
    BjjEireCompetitionDto create(CreateBjjEireCompetitionCommand command);

    /**
     * Replaces the details and the division list of a draft or published competition.
     *
     * @param id competition id
     * @param command the full details; a division left out is removed
     * @return the updated competition, or empty when the id is unknown
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code division-has-signups} when a removed
     *     division still has active sign-ups; 409 when the competition is finished or cancelled, or would stop being
     *     publishable
     */
    Optional<BjjEireCompetitionDto> update(String id, UpdateBjjEireCompetitionCommand command);

    /**
     * Makes a draft visible to the public.
     *
     * @param id competition id
     * @return the published competition, or empty when the id is unknown
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code no-divisions}, {@code invalid-window},
     *     or when it is not a draft
     */
    Optional<BjjEireCompetitionDto> publish(String id);

    /**
     * Returns a competition the public may see, read fresh from the database, with its registration state worked out
     * for now. For sign-ups, which must not act on a cached place count.
     *
     * @param id competition id
     * @return the competition, or empty when the id is unknown or it is a draft
     */
    Optional<BjjEireCompetitionDto> getPublicById(String id);

    /**
     * Takes one place, atomically: only while the competition is published and below its competitor limit (FR-022).
     *
     * @param id competition id
     * @return true when a place was taken; false when it is full or no longer published
     */
    boolean takePlace(String id);

    /**
     * Gives one place back. Never takes the count below zero.
     *
     * @param id competition id
     */
    void releasePlace(String id);

    /**
     * Cancels a draft or published competition. Asking again for a cancelled one returns it unchanged, so a refund run
     * that stopped part way can be resumed (FR-029).
     *
     * @param id competition id
     * @return the cancelled competition, or empty when the id is unknown
     * @throws org.springframework.web.server.ResponseStatusException 409 when it is finished
     */
    Optional<BjjEireCompetitionDto> cancel(String id);
}
