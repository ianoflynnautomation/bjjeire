package com.bjjeire.api.competitor;

import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Gender;
import java.time.LocalDate;

/**
 * The private details the organiser's sign-up list shows (FR-006). Never part of a public or competitor response.
 *
 * @param phone null when not given
 */
public record CompetitorContact(
        String competitorId, String email, String phone, LocalDate dateOfBirth, Gender gender, Belt belt) {}
