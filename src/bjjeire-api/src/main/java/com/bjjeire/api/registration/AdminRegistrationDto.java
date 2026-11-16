package com.bjjeire.api.registration;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.DivisionDto;
import com.bjjeire.api.bjjeirecompetition.Gender;
import java.time.Instant;
import java.time.LocalDate;

/**
 * One row of the organiser's sign-up list (FR-006). Admin only: these fields never appear in a public response.
 *
 * @param email null once the competitor deleted their account
 * @param division null when the division has since been removed
 * @param paymentUnconfirmed Stripe reports the session paid but no webhook confirmed it: resolve by hand
 * @param academyKey the key academy points group by, which the team-name merge takes ({@code name:team x},
 *     {@code gym:<id>}); null for no academy
 * @param affiliationKey the key affiliation points group by; null for none
 * @param profileMismatch the profile's belt or gender no longer fits the division
 */
public record AdminRegistrationDto(
        String registrationId,
        String displayName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        Gender gender,
        Belt belt,
        String academy,
        String affiliation,
        String academyKey,
        String affiliationKey,
        DivisionDto division,
        RegistrationStatus status,
        int amountCents,
        PaymentStatus paymentStatus,
        RefundStatus refundStatus,
        boolean paymentUnconfirmed,
        boolean profileMismatch,
        Instant createdAt) {}
