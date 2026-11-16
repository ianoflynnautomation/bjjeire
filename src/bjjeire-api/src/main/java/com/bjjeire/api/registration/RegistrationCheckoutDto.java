package com.bjjeire.api.registration;

import java.time.Instant;

/**
 * Where to send the competitor to pay.
 *
 * @param checkoutUrl the hosted Checkout page
 * @param holdExpiresAt the place is released at this instant unless paid
 */
public record RegistrationCheckoutDto(String registrationId, String checkoutUrl, Instant holdExpiresAt) {}
