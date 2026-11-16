package com.bjjeire.api.registration;

import com.bjjeire.api.common.ValidObjectId;
import jakarta.validation.constraints.NotNull;

/** Moves a confirmed sign-up to another division of the same tournament, at no charge (FR-028, FR-007). */
public record ChangeDivisionCommand(@NotNull @ValidObjectId String divisionId) {}
