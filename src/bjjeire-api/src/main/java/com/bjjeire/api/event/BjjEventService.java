package com.bjjeire.api.event;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import java.util.List;
import java.util.Optional;

/** Use cases for events. Controllers depend on this type, not the Mongo implementation. */
public interface BjjEventService {
    /**
     * Lists events.
     *
     * @param paginationRequest page and page size
     * @param county county filter, or null for every county
     * @param types event types, or null for every type
     * @param includeInactive when false, expired and inactive events are omitted
     * @param basePath path used to build page links
     * @return the page, with navigation links
     */
    PagedResponse<BjjEventDto> getAll(
            PaginationRequest paginationRequest,
            County county,
            List<BjjEventType> types,
            boolean includeInactive,
            String basePath);

    /**
     * Returns one event.
     *
     * @param id event id
     * @return the event, or empty when it is missing
     */
    Optional<BjjEventDto> getById(String id);

    /**
     * Inserts an event. A missing id is generated.
     *
     * @param command event to create
     * @return the created event
     */
    CreateBjjEventResponse create(CreateBjjEventCommand command);

    /**
     * Replaces the event when the version matches.
     *
     * @param id path id
     * @param command full event, including the last-read version
     * @return the updated event, or empty when the id is missing
     */
    Optional<UpdateBjjEventResponse> update(String id, UpdateBjjEventCommand command);

    /**
     * Deletes the event.
     *
     * @param id event id
     * @return false when the id is missing
     */
    boolean delete(String id);
}
