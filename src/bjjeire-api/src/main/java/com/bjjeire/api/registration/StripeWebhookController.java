package com.bjjeire.api.registration;

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
 * The one write with no bearer token (ADR-0013). Authenticated by the {@code Stripe-Signature} header, which the
 * service verifies over the raw body. Hidden from the published OpenAPI: only Stripe calls it.
 */
@Hidden
@RestController
@RequiredArgsConstructor
public class StripeWebhookController {
    private final StripeWebhookService webhookService;

    @PostMapping(ApiRoutes.STRIPE_WEBHOOK)
    public ResponseEntity<Void> receiveStripeEvent(
            @RequestBody(required = false) byte[] body,
            @RequestHeader(name = "Stripe-Signature", required = false) String signature) {
        String payload = body == null ? "" : new String(body, StandardCharsets.UTF_8);
        webhookService.handle(payload, signature);
        return ResponseEntity.ok().build();
    }
}
