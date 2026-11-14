package com.bjjeire.api.tournament;

/** Age categories on offer. A competitor may enter any category whose minimum age they meet. */
public enum AgeCategory {
    ADULT(18),
    MASTER_1(30),
    MASTER_2(36),
    MASTER_3(41),
    MASTER_4(46),
    MASTER_5(51);

    private final int minimumAge;

    AgeCategory(int minimumAge) {
        this.minimumAge = minimumAge;
    }

    /**
     * Returns the youngest age, on the tournament day, that may enter.
     *
     * @return age in whole years
     */
    public int minimumAge() {
        return minimumAge;
    }
}
