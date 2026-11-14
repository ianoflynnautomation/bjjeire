package com.bjjeire.api.tournament;

import java.util.Set;

/** Where a tournament is in its life. Only {@link #DRAFT} is hidden from the public. */
public enum TournamentStatus {
    DRAFT,
    PUBLISHED,
    CANCELLED,
    FINISHED;

    /** The statuses a visitor may see. */
    public static final Set<TournamentStatus> PUBLIC = Set.of(PUBLISHED, FINISHED, CANCELLED);

    /**
     * Tells whether a tournament in this status may move to another.
     *
     * @param target the status asked for
     * @return true for draft to published, published to finished, and draft or published to cancelled
     */
    public boolean canBecome(TournamentStatus target) {
        return switch (this) {
            case DRAFT -> target == PUBLISHED || target == CANCELLED;
            case PUBLISHED -> target == FINISHED || target == CANCELLED;
            case CANCELLED, FINISHED -> false;
        };
    }
}
