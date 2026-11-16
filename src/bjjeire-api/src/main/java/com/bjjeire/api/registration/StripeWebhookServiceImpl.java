package com.bjjeire.api.registration;

import com.bjjeire.api.config.BjjEireProperties;
import com.bjjeire.api.web.ApiProblems;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.net.Webhook;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Verifies the signature with Stripe's SDK, then reads the few fields it needs with Jackson rather than the SDK's event
 * model, so a change of Stripe API version cannot make an event unreadable. The event id goes into {@link StripeEvent}
 * first; when handling fails it is removed again, so Stripe's retry is handled.
 */
@Slf4j
@Service
public class StripeWebhookServiceImpl implements StripeWebhookService {
    static final String SESSION_COMPLETED = "checkout.session.completed";
    static final String SESSION_ASYNC_SUCCEEDED = "checkout.session.async_payment_succeeded";
    static final String SESSION_EXPIRED = "checkout.session.expired";
    static final String SESSION_ASYNC_FAILED = "checkout.session.async_payment_failed";

    private static final Set<String> HANDLED =
            Set.of(SESSION_COMPLETED, SESSION_ASYNC_SUCCEEDED, SESSION_EXPIRED, SESSION_ASYNC_FAILED);
    private static final long TOLERANCE_SECONDS = Webhook.DEFAULT_TOLERANCE;
    private static final Duration LEDGER_TTL = Duration.ofDays(30);

    private final RegistrationService registrationService;
    private final MongoTemplate mongoTemplate;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final String webhookSecret;

    public StripeWebhookServiceImpl(
            RegistrationService registrationService,
            MongoTemplate mongoTemplate,
            ObjectMapper objectMapper,
            Clock clock,
            BjjEireProperties properties) {
        this.registrationService = registrationService;
        this.mongoTemplate = mongoTemplate;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.webhookSecret = properties.stripe().webhookSecret();
    }

    @Override
    public void handle(String payload, String signatureHeader) {
        if (!StripeSecrets.isConfigured(webhookSecret)) {
            // A public placeholder secret would let anyone sign a "paid" event. Stripe retries a 503.
            log.error("Stripe webhook refused: STRIPE_WEBHOOK_SECRET is blank or a placeholder");
            throw ApiProblems.serviceUnavailable("Payment confirmation is not configured.");
        }
        verify(payload, signatureHeader);
        JsonNode event = read(payload);
        String eventId = text(event.at("/id"));
        String type = text(event.at("/type"));
        if (eventId == null || type == null) {
            throw ApiProblems.badRequest("The event has no id or type.");
        }
        if (!HANDLED.contains(type)) {
            log.debug("Stripe event {} of type {} ignored", eventId, type);
            return;
        }

        Instant now = clock.instant();
        try {
            mongoTemplate.insert(StripeEvent.builder()
                    .id(eventId)
                    .type(type)
                    .receivedAt(now)
                    .expiresAt(now.plus(LEDGER_TTL))
                    .handled(false)
                    .build());
        } catch (DuplicateKeyException seenBefore) {
            StripeEvent earlier = mongoTemplate.findById(eventId, StripeEvent.class);
            if (earlier != null && earlier.isHandled()) {
                log.info("Stripe event {} already handled", eventId);
                return;
            }
            // Recorded but never finished (a failure, or a pod that died): apply it now.
            log.warn("Stripe event {} was recorded but not finished; applying it again", eventId);
        }

        // A failure propagates: the webhook answers 5xx, the entry stays unhandled, and Stripe's retry applies it.
        dispatch(type, event.at("/data/object"));
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(eventId)), Update.update("handled", true), StripeEvent.class);
    }

    private void dispatch(String type, JsonNode session) {
        String registrationId = text(session.at("/client_reference_id"));
        if (registrationId == null) {
            registrationId = text(session.at("/metadata/registrationId"));
        }
        String sessionId = text(session.at("/id"));
        switch (type) {
            case SESSION_COMPLETED, SESSION_ASYNC_SUCCEEDED -> {
                if (!"paid".equals(text(session.at("/payment_status")))) {
                    // A delayed payment method: Stripe sends async_payment_succeeded when the money arrives.
                    log.info("Checkout session {} completed but not yet paid", sessionId);
                    return;
                }
                registrationService.onCheckoutPaid(registrationId, sessionId, text(session.at("/payment_intent")));
            }
            case SESSION_EXPIRED, SESSION_ASYNC_FAILED ->
                registrationService.onCheckoutExpired(registrationId, sessionId);
            default -> log.debug("Stripe event type {} not handled", type);
        }
    }

    private void verify(String payload, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            throw ApiProblems.badRequest("The Stripe-Signature header is missing.");
        }
        try {
            Webhook.Signature.verifyHeader(payload, signatureHeader, webhookSecret, TOLERANCE_SECONDS, clock);
        } catch (SignatureVerificationException invalid) {
            log.warn("Stripe webhook rejected: {}", invalid.getMessage());
            throw ApiProblems.badRequest("The Stripe-Signature header does not match the body.");
        }
    }

    private JsonNode read(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (JacksonException unreadable) {
            throw ApiProblems.badRequest("The event body is not JSON.");
        }
    }

    private static String text(JsonNode node) {
        return node == null
                        || node.isMissingNode()
                        || node.isNull()
                        || node.asString().isBlank()
                ? null
                : node.asString();
    }
}
