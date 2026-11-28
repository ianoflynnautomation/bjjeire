package com.bjjeire.api.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.bjjeire.api.config.BjjEireProperties;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

/** The placeholder shop webhook secret is public: with it nothing may be confirmed (contracts/stripe-webhook.md). */
class OrderWebhookConfigurationTest {
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-05-31T00:00:00Z"), ZoneOffset.UTC);

    @ParameterizedTest
    @Tag("#6007")
    @ValueSource(strings = {"", "  ", "whsec_REPLACE_ME"})
    void shouldRefuseEveryWebhookWhileTheShopSigningSecretIsAPlaceholder(String secret) {
        OrderService orders = mock(OrderService.class);
        MongoTemplate mongo = mock(MongoTemplate.class);
        SimpleMeterRegistry meters = new SimpleMeterRegistry();
        OrderWebhookServiceImpl webhook = new OrderWebhookServiceImpl(
                orders, mongo, JsonMapper.builder().build(), CLOCK, properties(secret), new OrderMetrics(meters));

        assertThatThrownBy(() -> webhook.handle("{}", "t=1,v1=abc"))
                .isInstanceOfSatisfying(ResponseStatusException.class, refused -> {
                    assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(refused.getBody().getType()).hasToString("urn:bjjeire:service-unavailable");
                });
        verifyNoInteractions(orders, mongo);
        assertThat(meters.get(OrderMetrics.WEBHOOK_REJECTED)
                        .tag("reason", "unconfigured")
                        .counter()
                        .count())
                .isEqualTo(1);
    }

    private static BjjEireProperties properties(String shopSecret) {
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
                new BjjEireProperties.Stripe("sk_test_real", "whsec_real", "https://bjjeire.com", shopSecret),
                null,
                null,
                null);
    }
}
