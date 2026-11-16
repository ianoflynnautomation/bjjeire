package com.bjjeire.api.registration;

import com.bjjeire.api.common.ValidObjectId;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Merges differently typed academy or affiliation names in one tournament, so points are not split (FR-007).
 *
 * @param fromKeys the grouping keys to rewrite, as {@code TeamKeys} builds them ({@code name:team x}, {@code gym:<id>},
 *     or an affiliation's normalised name)
 * @param target the name every matching sign-up shows from now on
 * @param targetGymId ACADEMY only: the directory gym the merged academy is; its points then key on the gym
 */
public record MergeTeamsCommand(
        @NotNull TeamKind kind,
        @NotEmpty @Size(max = 50) List<@NotBlank @Size(max = 120) String> fromKeys,
        @NotBlank @Size(max = 80) String target,
        @ValidObjectId String targetGymId) {}
