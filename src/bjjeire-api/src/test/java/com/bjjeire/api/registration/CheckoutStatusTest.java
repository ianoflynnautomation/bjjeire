package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.registration.PaymentGateway.CheckoutStatus;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Reading Stripe's Checkout Session `status` and `payment_status`. */
class CheckoutStatusTest {
    @ParameterizedTest
    @CsvSource({
        "open,unpaid,OPEN",
        "complete,paid,PAID",
        "complete,no_payment_required,PAID",
        "complete,unpaid,PROCESSING",
        "expired,unpaid,EXPIRED",
        ",,OPEN"
    })
    void shouldMapStripesSessionStateToWhatTheSignUpNeeds(
            String status, String paymentStatus, CheckoutStatus expected) {
        assertThat(CheckoutStatus.of(status, paymentStatus)).isEqualTo(expected);
    }
}
