package com.bjjeire.api.competitor;

import com.bjjeire.api.tournament.DivisionDto;
import java.util.List;
import java.util.Optional;

/** The signed-in competitor's own profile. Every method acts on the caller only; none takes a competitor id. */
public interface CompetitorService {
    /**
     * Returns the caller's profile.
     *
     * @param caller the identity from the token
     * @return the profile; before the first save an unsaved one ({@code saved} false) holding only the email
     */
    CompetitorDto getOwn(CompetitorIdentity caller);

    /**
     * Creates or replaces the caller's profile. One profile per identity, however many saves race.
     *
     * @param caller the identity from the token; its email is stored
     * @param command the details
     * @return the saved profile
     * @throws org.springframework.web.server.ResponseStatusException 400 {@code UNKNOWN_GYM} when the academy names a
     *     gym that is not in the directory
     */
    CompetitorDto saveOwn(CompetitorIdentity caller, SaveCompetitorCommand command);

    /**
     * The caller's medal totals and tournaments. Empty until results are recorded (slice 5).
     *
     * @param caller the identity from the token
     * @return the history
     */
    CompetitorHistoryDto getOwnHistory(CompetitorIdentity caller);

    /**
     * Deletes the caller's account: the profile, then the sign-in identity. From then on the identity's tokens are
     * refused, even if the directory could not be reached.
     *
     * @param caller the identity from the token
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code has-active-registration} while a
     *     sign-up is awaiting payment or confirmed
     */
    void deleteOwn(CompetitorIdentity caller);

    /**
     * Lists the divisions of a published tournament the caller may enter (FR-016).
     *
     * @param caller the signed-in competitor
     * @param tournamentId tournament id
     * @return eligible divisions in the tournament's order, possibly empty
     * @throws org.springframework.web.server.ResponseStatusException 404 for an unknown or draft tournament; 409
     *     {@code profile-incomplete} or {@code under-18}
     */
    List<DivisionDto> getEligibleDivisions(CompetitorIdentity caller, String tournamentId);

    /**
     * Returns what a sign-up needs from the caller's profile.
     *
     * @param caller the signed-in competitor
     * @return the profile, or empty when none is saved
     */
    Optional<SignUpProfile> findSignUpProfile(CompetitorIdentity caller);

    /**
     * Returns the sign-in email of a competitor, for sign-up mail sent without a caller (the payment webhook).
     *
     * @param competitorId profile id
     * @return the email, or empty when the account is gone or has none
     */
    Optional<String> findEmail(String competitorId);
}
