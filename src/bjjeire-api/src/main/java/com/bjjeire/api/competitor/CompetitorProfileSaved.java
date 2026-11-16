package com.bjjeire.api.competitor;

/**
 * Published after a competitor saves their profile, so their sign-ups can follow the change (research R8). The
 * {@code registration} package listens; this package does not depend on it.
 *
 * @param profile the profile as saved
 */
public record CompetitorProfileSaved(SignUpProfile profile) {}
