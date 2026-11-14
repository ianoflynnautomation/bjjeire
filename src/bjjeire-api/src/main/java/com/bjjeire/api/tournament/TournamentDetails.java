package com.bjjeire.api.tournament;

import com.bjjeire.api.common.Location;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** What the organiser sets on a tournament. Create and update send the same fields. */
public interface TournamentDetails {
    /** Lowercase letters, digits and single hyphens. {@code admin} is the admin route and cannot be a slug. */
    String SLUG_PATTERN = "^(?!admin$)[a-z0-9]+(?:-[a-z0-9]+)*$";

    String SLUG_MESSAGE = "must be lowercase letters, digits and hyphens, and must not be 'admin'";

    String slug();

    String name();

    String description();

    LocalDate date();

    Location venue();

    Integer entryFeeCents();

    Instant registrationOpensAt();

    Instant registrationClosesAt();

    Integer competitorLimit();

    List<DivisionDto> divisions();
}
