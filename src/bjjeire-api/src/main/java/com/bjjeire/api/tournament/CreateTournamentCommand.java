package com.bjjeire.api.tournament;

import com.bjjeire.api.common.Location;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Creates a tournament as a draft. */
public record CreateTournamentCommand(
        @NotBlank @Size(max = 80) @Pattern(regexp = SLUG_PATTERN, message = SLUG_MESSAGE) String slug,

        @NotBlank @Size(max = 120) String name,
        @Size(max = 4000) String description,
        @NotNull LocalDate date,
        @NotNull @ValidVenue Location venue,
        @NotNull @Min(0) Integer entryFeeCents,
        @NotNull Instant registrationOpensAt,
        @NotNull Instant registrationClosesAt,
        @Min(1) Integer competitorLimit,
        @Size(max = 500) List<@NotNull @Valid DivisionDto> divisions)
        implements TournamentDetails {}
