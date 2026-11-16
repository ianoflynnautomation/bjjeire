package com.bjjeire.api.registration;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** What was charged for a sign-up. Holds no card data (FR-023). Embedded in {@link TournamentRegistration}. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    private String checkoutSessionId;

    /** The hosted Checkout page; returned again while the hold lasts, so one sign-up has one payable session. */
    private String checkoutUrl;

    private String paymentIntentId;

    /** The tournament's fee when the sign-up started; a later fee change never touches it. */
    private int amountCents;

    private String currency;
    private PaymentStatus status;
    private Instant paidAt;

    /**
     * When the hold sweep found this session paid at Stripe but no webhook had confirmed it, and raised the alert. Set
     * once, so the alert fires once; the place stays held until the webhook arrives.
     */
    private Instant unconfirmedAlertedAt;
}
