package com.bjjeire.api.bjjeirecompetition;

import java.util.Collection;
import java.util.List;

/** What the competition needs to know about sign-ups: before it changes its divisions, and for its results. */
public interface DivisionSignUps {
    /**
     * Tells whether any of the divisions still has a sign-up that holds a place.
     *
     * @param competitionId the competition
     * @param divisionIds divisions about to be removed
     * @return true when at least one sign-up awaiting payment or confirmed is in one of them
     */
    boolean anyActive(String competitionId, Collection<String> divisionIds);

    /**
     * Lists the competition's confirmed sign-ups, by name.
     *
     * @param competitionId the competition
     * @return every confirmed sign-up, in any division
     */
    List<ResultEntrant> confirmed(String competitionId);

    /**
     * Reads sign-ups of the competition by id, whatever their status, so a podium still shows a medallist the organiser
     * later cancelled.
     *
     * @param competitionId the competition
     * @param registrationIds the ids
     * @return those found
     */
    List<ResultEntrant> byIds(String competitionId, Collection<String> registrationIds);
}
