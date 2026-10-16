package com.bjjeire.api.gym;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import java.util.Optional;

/** Use cases for gyms. Controllers depend on this type, not the Mongo implementation. */
public interface GymService {
    /**
     * Lists active gyms.
     *
     * @param paginationRequest page and page size
     * @param county county filter, or null for every county
     * @param basePath path used to build page links
     * @return the page, with navigation links
     */
    PagedResponse<GymDto> getAll(PaginationRequest paginationRequest, County county, String basePath);

    /**
     * Returns the active gym.
     *
     * @param id gym id
     * @return the gym, or empty when it is missing or not active
     */
    Optional<GymDto> getById(String id);

    /**
     * Inserts a gym. A blank id is treated as absent.
     *
     * @param command gym to create
     * @return the created gym
     */
    CreateGymResponse create(CreateGymCommand command);

    /**
     * Replaces the gym when the version matches.
     *
     * @param id path id
     * @param command full gym, including the last-read version
     * @return the updated gym, or empty when the id is missing
     */
    Optional<UpdateGymResponse> update(String id, UpdateGymCommand command);

    /**
     * Deletes the gym.
     *
     * @param id gym id
     * @return false when the id is missing
     */
    boolean delete(String id);
}
