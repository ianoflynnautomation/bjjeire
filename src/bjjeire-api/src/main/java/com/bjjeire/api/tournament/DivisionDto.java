package com.bjjeire.api.tournament;

import com.bjjeire.api.common.ValidObjectId;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * A division as served and as sent by the organiser.
 *
 * @param id absent for a division the organiser is adding; the API assigns it
 */
public record DivisionDto(
        @ValidObjectId String id,
        @NotNull Discipline discipline,
        @NotNull Gender gender,
        @NotNull AgeCategory ageCategory,
        @NotNull Belt belt,
        @NotBlank @Size(max = 40) String weightClass) {}
