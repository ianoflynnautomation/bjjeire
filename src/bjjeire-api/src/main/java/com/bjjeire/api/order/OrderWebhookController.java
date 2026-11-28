package com.bjjeire.api.order;

import com.bjjeire.api.common.ApiRoutes;
import io.swagger.v3.oas.annotations.Hidden;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * The shop's webhook, the second write with no bearer token (ADR-0016). Authenticated by the {@code Stripe-Signature}
 * header against the shop's own secret. Hidden from the published OpenAPI: only Stripe calls it.
 */
@Hidden
@RestController
@RequiredArgsConstructor
public class OrderWebhookController {
    private final OrderWebhookService webhookService;

    @PostMapping(ApiRoutes.ORDER_STRIPE_WEBHOOK)
    public ResponseEntity<Void> receiveStripeEvent(
            @RequestBody(required = false) byte[] body,
            @RequestHeader(name = "Stripe-Signature", required = false) String signature) {
        String payload = body == null ? "" : new String(body, StandardCharsets.UTF_8);
        webhookService.handle(payload, signature);
        return ResponseEntity.ok().build();
    }
}
