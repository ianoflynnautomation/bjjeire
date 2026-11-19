package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bjjeire.api.registration.PaymentGateway.CheckoutRequest;
import com.bjjeire.api.registration.PaymentGateway.CheckoutStatus;
import com.bjjeire.api.registration.PaymentGateway.PaymentGatewayException;
import com.bjjeire.api.registration.PaymentGateway.RefundRequest;
import com.stripe.exception.ApiConnectionException;
import com.stripe.exception.InvalidRequestException;
import java.time.Instant;
import org.junit.jupiter.api.Tag;
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

    /** ADR-0016: both webhooks see every event, so each session says whose it is. */
    @Test
    @Tag("#6027")
    void shouldMarkEveryCheckoutSessionAsARegistration() {
        CheckoutRequest request = new CheckoutRequest(
                "reg1",
                "comp1",
                "div1",
                "Open — -76 kg",
                2500,
                "EUR",
                "a@example.test",
                Instant.parse("2026-05-31T00:32:00Z"),
                "https://bjjeire.test/ok",
                "https://bjjeire.test/cancel",
                "checkout-reg1-1");

        assertThat(StripePaymentGateway.checkoutParams(request).getMetadata())
                .containsEntry("bjjeireKind", "registration")
                .containsEntry("registrationId", "reg1");
    }

    @Test
    @Tag("#6027")
    void shouldMarkEveryRefundAsARegistration() {
        RefundRequest request = new RefundRequest("reg1", "pi_1", 2500, "refund-reg1");

        assertThat(StripePaymentGateway.refundParams(request).getMetadata())
                .asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.MAP)
                .containsEntry("bjjeireKind", "registration")
                .containsEntry("registrationId", "reg1");
    }
}
