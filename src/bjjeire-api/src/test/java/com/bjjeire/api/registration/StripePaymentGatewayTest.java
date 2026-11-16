package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bjjeire.api.registration.PaymentGateway.CheckoutStatus;
import com.bjjeire.api.registration.PaymentGateway.PaymentGatewayException;
import com.stripe.exception.ApiConnectionException;
import com.stripe.exception.InvalidRequestException;
import org.junit.jupiter.api.Test;

/** What a failed "retrieve Checkout Session" means for a sign-up. */
class StripePaymentGatewayTest {
    @Test
    void shouldTreatASessionStripeDoesNotKnowAsClosed() {
        // After a key or sandbox switch, or test to live, the old sessions are gone for good.
        InvalidRequestException missing =
                new InvalidRequestException("No such checkout.session", "id", "req_1", "resource_missing", 404, null);

        assertThat(StripePaymentGateway.statusWhenRetrieveFails(missing)).isEqualTo(CheckoutStatus.EXPIRED);
    }

    @Test
    void shouldReportAnyOtherFailureAsUnknown() {
        ApiConnectionException offline = new ApiConnectionException("connection refused");
        InvalidRequestException badKey =
                new InvalidRequestException("Invalid API key", null, "req_2", "api_key_invalid", 401, null);

        assertThatThrownBy(() -> StripePaymentGateway.statusWhenRetrieveFails(offline))
                .isInstanceOf(PaymentGatewayException.class);
        assertThatThrownBy(() -> StripePaymentGateway.statusWhenRetrieveFails(badKey))
                .isInstanceOf(PaymentGatewayException.class);
    }
}
