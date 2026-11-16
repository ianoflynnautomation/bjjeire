package com.bjjeire.api.competitor;

/**
 * Published, synchronously, when a competitor's account is about to be deleted and before anything else changes, so the
 * {@code registration} package anonymises their sign-ups (research R11, FR-013). A listener that fails stops the
 * deletion, which can then be retried.
 *
 * @param competitorId the profile id the sign-ups refer to
 */
public record CompetitorAccountDeleting(String competitorId) {}
