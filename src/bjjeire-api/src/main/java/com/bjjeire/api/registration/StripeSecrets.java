package com.bjjeire.api.registration;

/**
 * Tells a real Stripe value from the placeholders in application.yml and compose. Those are public, so with one of them
 * nothing may be charged or confirmed: anyone could sign a webhook with {@code whsec_REPLACE_ME}.
 */
final class StripeSecrets {
    private static final String PLACEHOLDER = "REPLACE_ME";

    private StripeSecrets() {}

    static boolean isConfigured(String value) {
        return value != null && !value.isBlank() && !value.contains(PLACEHOLDER);
    }
}
