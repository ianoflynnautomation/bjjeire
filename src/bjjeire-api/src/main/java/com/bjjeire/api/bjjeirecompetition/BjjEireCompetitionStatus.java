package com.bjjeire.api.bjjeirecompetition;

import java.util.Set;

/** Where a competition is in its life. Only {@link #DRAFT} is hidden from the public. */
public enum BjjEireCompetitionStatus {
    DRAFT,
    PUBLISHED,
    CANCELLED,
    FINISHED;

    /** The statuses a visitor may see. */
    public static final Set<BjjEireCompetitionStatus> PUBLIC = Set.of(PUBLISHED, FINISHED, CANCELLED);

    /**
     * Tells whether a competition in this status may move to another.
     *
     * @param target the status asked for
     * @return true for draft to published, published to finished, and draft or published to cancelled
     */
    public boolean canBecome(BjjEireCompetitionStatus target) {
        return switch (this) {
            case DRAFT -> target == PUBLISHED || target == CANCELLED;
            case PUBLISHED -> target == FINISHED || target == CANCELLED;
            case CANCELLED, FINISHED -> false;
        };
    }
}
