package com.bjjeire.api.competitor;

/**
 * Published after a competitor saves their profile, so their sign-ups can follow the change (research R8). The
 * {@code registration} package listens; this package does not depend on it.
 *
 * <p>Stored in the event publication registry until a listener completes it (ADR-0017), so it carries the id only and
 * no personal data. The listener reads the profile as it is when it runs, so a retried event applies the latest save.
 *
 * @param competitorId the saved profile's id
 */
public record CompetitorProfileSaved(String competitorId) {}
