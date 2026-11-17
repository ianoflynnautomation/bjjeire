package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.bjjeire.api.config.BjjEireProperties;
import com.bjjeire.api.registration.PaymentGateway.CheckoutRequest;
import com.bjjeire.api.registration.PaymentGateway.PaymentGatewayException;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

/**
 * The placeholder Stripe values in application.yml are public. With them, nothing may be confirmed or charged: the
 * webhook answers 503 and checkout fails before any call to Stripe (FR-018).
 */
class StripeConfigurationTest {
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-05-31T00:00:00Z"), ZoneOffset.UTC);

    @ParameterizedTest
    @ValueSource(strings = {"", "  ", "whsec_REPLACE_ME"})
    void shouldRefuseEveryWebhookWhileTheSigningSecretIsAPlaceholder(String secret) {
        RegistrationService registrations = mock(RegistrationService.class);
        CancellationService cancellations = mock(CancellationService.class);
        MongoTemplate mongo = mock(MongoTemplate.class);
        SimpleMeterRegistry meters = new SimpleMeterRegistry();
        StripeWebhookServiceImpl webhook = new StripeWebhookServiceImpl(
                registrations,
                cancellations,
                mongo,
                JsonMapper.builder().build(),
                CLOCK,
                properties("sk_test_real", secret),
                new RegistrationMetrics(meters));

        assertThatThrownBy(() -> webhook.handle("{}", "t=1,v1=abc"))
                .isInstanceOfSatisfying(ResponseStatusException.class, refused -> {
                    assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(refused.getBody().getType()).hasToString("urn:bjjeire:service-unavailable");
                });
        verifyNoInteractions(registrations, cancellations, mongo);
        assertThat(meters.get(RegistrationMetrics.WEBHOOK_REJECTED)
                        .tag("reason", "unconfigured")
                        .counter()
                        .count())
                .isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "sk_test_REPLACE_ME"})
    void shouldRefuseToOpenACheckoutWhileTheSecretKeyIsAPlaceholder(String key) {
        StripePaymentGateway gateway = new StripePaymentGateway(properties(key, "whsec_real"));

        assertThatThrownBy(() -> gateway.createCheckout(request()))
                .isInstanceOf(PaymentGatewayException.class)
                .hasMessageContaining("not configured");
    }

    @Test
    void shouldTreatOnlyBlankOrReplaceMeValuesAsPlaceholders() {
        assertThat(StripeSecrets.isConfigured("whsec_abc123")).isTrue();
        assertThat(StripeSecrets.isConfigured("whsec_REPLACE_ME")).isFalse();
        assertThat(StripeSecrets.isConfigured(null)).isFalse();
    }

    private static BjjEireProperties properties(String key, String webhookSecret) {
        return new BjjEireProperties(
                null,
                null,
                null,
                null,
                null,
                Map.of(),
                null,
                null,
                null,
                new BjjEireProperties.Stripe(key, webhookSecret, "https://bjjeire.com"),
                null,
                null);
    }

    private static CheckoutRequest request() {
        return new CheckoutRequest(
                "r",
                "t",
                "d",
                "BjjEire",
                2500,
                "EUR",
                "a@example.test",
                Instant.parse("2026-05-31T00:32:00Z"),
                "https://bjjeire.com/ok",
                "https://bjjeire.com/back",
                "checkout-r-1");
    }
}
