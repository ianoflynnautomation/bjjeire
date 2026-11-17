package com.bjjeire.api.bjjeirecompetition;

/** A podium place and the team points it earns (FR-033). */
public enum Medal {
    GOLD(9),
    SILVER(3),
    BRONZE(1);

    private final int points;

    Medal(int points) {
        this.points = points;
    }

    /** Points this medal adds to the medallist's academy and affiliation. */
    public int points() {
        return points;
    }
}
