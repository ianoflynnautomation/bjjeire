package com.bjjeire.api.bjjeirecompetition;

import java.util.Collection;

/** What the competition needs to know about sign-ups before it changes its divisions. */
public interface DivisionSignUps {
    /**
     * Tells whether any of the divisions still has a sign-up that holds a place.
     *
     * @param competitionId the competition
     * @param divisionIds divisions about to be removed
     * @return true when at least one sign-up awaiting payment or confirmed is in one of them
     */
    boolean anyActive(String competitionId, Collection<String> divisionIds);
}
