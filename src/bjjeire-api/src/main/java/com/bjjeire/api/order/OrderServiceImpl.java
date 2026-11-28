package com.bjjeire.api.order;

import com.bjjeire.api.config.BjjEireProperties;
import com.bjjeire.api.order.ShopPaymentGateway.CheckoutSession;
import com.bjjeire.api.order.ShopPaymentGateway.CheckoutStatus;
import com.bjjeire.api.order.ShopPaymentGateway.PaymentGatewayException;
import com.bjjeire.api.order.ShopPaymentGateway.RefundResult;
import com.bjjeire.api.order.ShopPaymentGateway.ShopCheckoutRequest;
import com.bjjeire.api.order.ShopPaymentGateway.ShopLineItem;
import com.bjjeire.api.order.ShopPaymentGateway.ShopRefundRequest;
import com.bjjeire.api.product.ProductOffer;
import com.bjjeire.api.product.ProductService;
import com.bjjeire.api.product.StockLedger;
import com.bjjeire.api.product.StockLedger.StockLine;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Mongo and Stripe implementation of {@link OrderService}. Every change of an order's status is a single-document
 * update guarded on the status it leaves, so a redelivered event, a second pod or the sweep applies it at most once.
 * Stock moves through {@link StockLedger} after the order's own update, as registration's places do (research R5).
 */
@Slf4j
@Service
public class OrderServiceImpl implements OrderService {
    private static final int SWEEP_BATCH = 200;
    private static final int NUMBER_ATTEMPTS = 5;
    private static final String NUMBER_INDEX = "ux_order_number";
    private static final String EMAIL_SLOT_INDEX = "ux_order_unpaid_email_slot";
    private static final String IP_SLOT_INDEX = "ux_order_unpaid_ip_slot";
    private static final Duration UNKNOWN_STATE_ALERT_AFTER = Duration.ofHours(24);

    private final MongoTemplate mongoTemplate;
    private final ProductService productService;
    private final StockLedger ledger;
    private final ShopPaymentGateway paymentGateway;
    private final OrderMailSender mailSender;
    private final OrderMetrics metrics;
    private final Clock clock;
    private final BjjEireProperties.Order limits;
    private final String siteUrl;
    private final SecureRandom random = new SecureRandom();

    public OrderServiceImpl(
            MongoTemplate mongoTemplate,
            ProductService productService,
            StockLedger ledger,
            ShopPaymentGateway paymentGateway,
            OrderMailSender mailSender,
            OrderMetrics metrics,
            Clock clock,
            BjjEireProperties properties) {
        this.mongoTemplate = mongoTemplate;
        this.productService = productService;
        this.ledger = ledger;
        this.paymentGateway = paymentGateway;
        this.mailSender = mailSender;
        this.metrics = metrics;
        this.clock = clock;
        this.limits = properties.order();
        this.siteUrl = properties.stripe().successUrlBase();
    }

    // ---- Checkout -------------------------------------------------------------------------------------------------

    @Override
    public ShopDeliveryDto getDelivery() {
        return new ShopDeliveryDto(deliveryFeeCents(), MerchOrder.CURRENCY, OrderRules.DELIVERY_COUNTRIES);
    }

    @Override
    public OrderCheckoutDto create(CreateOrderCommand command, String clientIp) {
        OrderRules.requireWithinLimits(command.lines(), limits.maxUnitsPerLine(), limits.maxUnitsPerOrder());
        OrderRules.requireDeliverable(command.address());
        Map<String, ProductOffer> offers =
                productService
                        .getOffers(command.lines().stream()
                                .map(OrderLineCommand::productId)
                                .distinct()
                                .toList())
                        .stream()
                        .collect(Collectors.toMap(ProductOffer::id, Function.identity()));
        int deliveryCents = deliveryFeeCents();
        requireUnchanged(command, offers, deliveryCents);

        String email = command.email().trim().toLowerCase(Locale.ROOT);
        requireFewUnpaid(email, clientIp);

        List<OrderLine> lines = command.lines().stream()
                .map(line -> toLine(line, offers.get(line.productId())))
                .toList();
        List<StockLine> stock = stockLines(lines);
        Optional<StockLine> soldOut = ledger.holdAll(stock);
        if (soldOut.isPresent()) {
            StockLine line = soldOut.get();
            throw ApiProblems.conflict(
                    ProblemTypes.SIZE_SOLD_OUT,
                    "Size " + line.sizeId() + " of "
                            + offers.get(line.productId()).name()
                            + " just sold out. Nothing was charged; remove it from your basket to carry on.");
        }

        String key = OrderAccessKeys.newKey();
        MerchOrder order;
        try {
            order = insertHoldingSlots(newOrder(lines, deliveryCents, email, command.address(), clientIp, key));
        } catch (RuntimeException failed) {
            ledger.releaseAll(stock);
            throw failed;
        }

        CheckoutSession session;
        try {
            session = paymentGateway.createCheckout(checkoutRequest(order));
        } catch (PaymentGatewayException failed) {
            // Nothing reached Stripe that can be paid: forget the order and give the stock back.
            mongoTemplate.remove(Query.query(Criteria.where("_id").is(order.getId())), MerchOrder.class);
            ledger.releaseAll(stock);
            log.error("Checkout for order {} could not be created: {}", order.getId(), failed.getMessage());
            throw ApiProblems.badGateway(
                    ProblemTypes.PAYMENT_UNAVAILABLE,
                    "Payment is unavailable right now. Nothing was charged; please try again shortly.");
        }
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(order.getId())),
                new Update().set("payment.checkoutSessionId", session.id()).set("payment.checkoutUrl", session.url()),
                MerchOrder.class);
        metrics.checkoutStarted();
        log.info(
                "Order {} ({}) started: {} line(s), {} cents",
                order.getId(),
                order.getNumber(),
                lines.size(),
                order.getTotalCents());
        return new OrderCheckoutDto(order.getId(), key, session.url(), order.getHoldExpiresAt(), order.getTotalCents());
    }

    /** Refuses a basket whose lines or delivery fee are no longer what the shopper saw (#6010, research R8). */
    private static void requireUnchanged(
            CreateOrderCommand command, Map<String, ProductOffer> offers, int deliveryCents) {
        List<BasketChangeDto> changes = new ArrayList<>();
        for (OrderLineCommand line : command.lines()) {
            ProductOffer offer = offers.get(line.productId());
            Integer available = offer == null ? null : offer.available().get(line.sizeId());
            if (offer == null || !offer.onSale() || available == null) {
                changes.add(new BasketChangeDto(
                        line.productId(), line.sizeId(), BasketChangeReason.UNAVAILABLE, null, null));
            } else if (available < line.quantity()) {
                changes.add(new BasketChangeDto(
                        line.productId(), line.sizeId(), BasketChangeReason.SOLD_OUT, available, null));
            } else if (offer.priceCents() != line.unitPriceCents()) {
                changes.add(new BasketChangeDto(
                        line.productId(), line.sizeId(), BasketChangeReason.PRICE_CHANGED, null, offer.priceCents()));
            }
        }
        boolean deliveryChanged = command.deliveryCents() != deliveryCents;
        if (changes.isEmpty() && !deliveryChanged) {
            return;
        }
        ResponseStatusException changed = ApiProblems.conflict(
                ProblemTypes.BASKET_CHANGED,
                "Your basket changed since you last saw it. Check the changes and try again. Nothing was charged.");
        changed.getBody().setProperty("lines", changes);
        if (deliveryChanged) {
            changed.getBody().setProperty("nowDeliveryCents", deliveryCents);
        }
        throw changed;
    }

    private void requireFewUnpaid(String email, String clientIp) {
        long byEmail = unpaidCount(Criteria.where("email").is(email));
        long byIp =
                clientIp == null ? 0 : unpaidCount(Criteria.where("clientIp").is(clientIp));
        if (byEmail >= limits.maxUnpaidPerEmail() || byIp >= limits.maxUnpaidPerIp()) {
            throw tooManyUnpaid();
        }
    }

    private static ResponseStatusException tooManyUnpaid() {
        return ApiProblems.conflict(
                ProblemTypes.TOO_MANY_UNPAID,
                "You already have unpaid orders waiting. Pay for one, or wait 30 minutes for them to lapse.");
    }

    private long unpaidCount(Criteria which) {
        return mongoTemplate.count(Query.query(which.and("status").is(OrderStatus.AWAITING_PAYMENT)), MerchOrder.class);
    }

    /**
     * Inserts the order holding a free unpaid slot for its email and for its client address, and a fresh number. The
     * partial unique indexes make the limits exact under any concurrency (research R7), as registration's unpaid slots
     * do.
     *
     * @throws ResponseStatusException 409 {@code too-many-unpaid} when every slot of either is taken
     */
    private MerchOrder insertHoldingSlots(MerchOrder order) {
        int ipSlots = order.getClientIp() == null ? 1 : limits.maxUnpaidPerIp();
        for (int emailSlot = 0; emailSlot < limits.maxUnpaidPerEmail(); emailSlot++) {
            for (int ipSlot = 0; ipSlot < ipSlots; ipSlot++) {
                MerchOrder slotted = order.toBuilder()
                        .emailSlot(emailSlot)
                        .ipSlot(order.getClientIp() == null ? null : ipSlot)
                        .build();
                try {
                    return insertNumbered(slotted);
                } catch (DuplicateKeyException taken) {
                    String index = String.valueOf(taken.getMessage());
                    if (index.contains(EMAIL_SLOT_INDEX)) {
                        break;
                    }
                    if (!index.contains(IP_SLOT_INDEX)) {
                        throw taken;
                    }
                }
            }
        }
        throw tooManyUnpaid();
    }

    private MerchOrder insertNumbered(MerchOrder order) {
        for (int attempt = 1; ; attempt++) {
            try {
                return mongoTemplate.insert(order.toBuilder()
                        .number(OrderRules.number(order.getCreatedOnUtc(), random))
                        .build());
            } catch (DuplicateKeyException taken) {
                if (attempt >= NUMBER_ATTEMPTS
                        || !String.valueOf(taken.getMessage()).contains(NUMBER_INDEX)) {
                    throw taken;
                }
            }
        }
    }

    @Override
    public Optional<OrderDto> getWithKey(String id, String key) {
        return withKey(id, key).map(OrderServiceImpl::toDto);
    }

    @Override
    public OrderCheckoutDto resumeCheckout(String id, String key) {
        MerchOrder order = withKey(id, key).orElseThrow(ApiProblems::notFound);
        boolean awaiting = order.getStatus() == OrderStatus.AWAITING_PAYMENT
                && order.getPayment() != null
                && order.getPayment().getCheckoutSessionId() != null;
        // Asked before the hold check: a payment whose webhook is late is still a payment.
        if (awaiting && alreadyPaid(order)) {
            throw ApiProblems.conflict(
                    ProblemTypes.PAYMENT_RECEIVED,
                    "Your payment was received. Your order is being confirmed and will show as confirmed shortly.");
        }
        if (!awaiting
                || order.getHoldExpiresAt() == null
                || !clock.instant().isBefore(order.getHoldExpiresAt())
                || order.getPayment().getCheckoutUrl() == null) {
            throw ApiProblems.conflict(
                    ProblemTypes.HOLD_EXPIRED,
                    "This order is no longer waiting for payment. Its items went back on sale; start a new order"
                            + " from your basket.");
        }
        // The open session, not a new one: one order never has two payable checkouts (FR-012).
        return new OrderCheckoutDto(
                order.getId(),
                null,
                order.getPayment().getCheckoutUrl(),
                order.getHoldExpiresAt(),
                order.getTotalCents());
    }

    private Optional<MerchOrder> withKey(String id, String key) {
        return Optional.ofNullable(mongoTemplate.findById(id, MerchOrder.class))
                .filter(order -> OrderAccessKeys.matches(key, order.getAccessKeyHash()));
    }

    // ---- Stripe ---------------------------------------------------------------------------------------------------

    @Override
    public void onCheckoutPaid(String orderId, String checkoutSessionId, String paymentIntentId) {
        MerchOrder order = findForSession(orderId, checkoutSessionId);
        if (order == null) {
            return;
        }
        switch (order.getStatus()) {
            case CONFIRMED, DISPATCHED, REFUNDED -> log.info("Payment for order {} already handled", orderId);
            case AWAITING_PAYMENT -> {
                MerchOrder before = move(orderId, OrderStatus.AWAITING_PAYMENT, confirmation(paymentIntentId));
                if (before == null) {
                    // The sweep or the expiry event ended the hold a moment ago; treat it as a late payment.
                    onCheckoutPaid(orderId, checkoutSessionId, paymentIntentId);
                    return;
                }
                ledger.commitAll(stockLines(before.getLines()));
                afterConfirmed(before);
            }
            case EXPIRED -> lateConfirmOrRefund(order, paymentIntentId);
            default -> throw new IllegalStateException("Unknown status " + order.getStatus());
        }
    }

    /** FR-013: a payment after the hold ended confirms if the stock is still there, and is refunded otherwise. */
    private void lateConfirmOrRefund(MerchOrder order, String paymentIntentId) {
        if (order.getRefund() != null) {
            // A refund was already tried and may have gone through at Stripe even if we saw it fail. Never confirm
            // after that: finish the refund with the same idempotency key (FR-012).
            refundLatePayment(order, paymentIntentId);
            return;
        }
        List<StockLine> stock = stockLines(order.getLines());
        if (ledger.takeAll(stock).isEmpty()) {
            MerchOrder before = move(order.getId(), OrderStatus.EXPIRED, confirmation(paymentIntentId));
            if (before != null) {
                log.info("Late payment for order {} confirmed with stock still available", order.getId());
                afterConfirmed(before);
                return;
            }
            ledger.restockAll(stock);
            MerchOrder current = mongoTemplate.findById(order.getId(), MerchOrder.class);
            if (current == null || current.getStatus() != OrderStatus.EXPIRED) {
                return;
            }
        }
        refundLatePayment(order, paymentIntentId);
    }

    private void refundLatePayment(MerchOrder order, String paymentIntentId) {
        int amount = order.getTotalCents();
        metrics.refundRequested();
        RefundResult refund;
        try {
            refund = paymentGateway.refund(
                    new ShopRefundRequest(order.getId(), paymentIntentId, amount, refundKey(order.getId())));
        } catch (PaymentGatewayException failed) {
            recordFailedRefund(order, paymentIntentId, amount, failed);
            // The webhook answers 5xx and Stripe's retry asks again with the same idempotency key.
            throw failed;
        }
        Instant now = clock.instant();
        Update update = paid(new Update(), paymentIntentId, now)
                .set("status", OrderStatus.REFUNDED)
                .unset("accessKey")
                .set(
                        "refund",
                        OrderRefund.builder()
                                .refundId(refund.refundId())
                                .amountCents(amount)
                                .attempts(1)
                                .status(refund.succeeded() ? OrderRefundStatus.REFUNDED : OrderRefundStatus.PENDING)
                                .requestedAt(now)
                                .completedAt(refund.succeeded() ? now : null)
                                .build());
        if (refund.succeeded()) {
            update.set("refundedAt", now);
        }
        MerchOrder refunded = mongoTemplate.findAndModify(
                Query.query(
                        Criteria.where("_id").is(order.getId()).and("status").is(OrderStatus.EXPIRED)),
                update,
                FindAndModifyOptions.options().returnNew(true),
                MerchOrder.class);
        if (refunded == null) {
            return;
        }
        if (refund.succeeded()) {
            metrics.refundSucceeded();
        }
        log.warn("Late payment for order {} refunded in full: its stock had sold out", refunded.getId());
        mailSender.send(OrderMails.refundedSoldOut(refunded));
    }

    /** Keeps a record that the money was taken and the refund failed, so the organiser sees it (#6021). */
    private void recordFailedRefund(MerchOrder order, String paymentIntentId, int amount, RuntimeException failed) {
        Instant now = clock.instant();
        mongoTemplate.updateFirst(
                Query.query(
                        Criteria.where("_id").is(order.getId()).and("status").is(OrderStatus.EXPIRED)),
                paid(new Update(), paymentIntentId, now)
                        // A refund was tried, so the order is never confirmed and needs no key (ADR-0018).
                        .unset("accessKey")
                        .set(
                                "refund",
                                OrderRefund.builder()
                                        .amountCents(amount)
                                        .attempts(1)
                                        .status(OrderRefundStatus.FAILED)
                                        .requestedAt(now)
                                        .failureReason(failed.getMessage())
                                        .build()),
                MerchOrder.class);
        metrics.refundFailed();
        log.error(
                "ALERT refund of order {} ({} cents) failed and must be resolved by hand if Stripe's retries also fail:"
                        + " {}",
                order.getId(),
                amount,
                failed.getMessage());
    }

    @Override
    public void onCheckoutExpired(String orderId, String checkoutSessionId) {
        if (findForSession(orderId, checkoutSessionId) != null) {
            expire(Criteria.where("_id").is(orderId));
        }
    }

    @Override
    public void onRefundUpdated(String orderId, String refundId, String status, String failureReason) {
        MerchOrder order = orderId == null ? null : mongoTemplate.findById(orderId, MerchOrder.class);
        if (order == null || order.getRefund() == null) {
            log.warn("Stripe refund {} names order {}, which has no refund", refundId, orderId);
            return;
        }
        // Matched by the stored refund id; a refund recorded without one takes the first Stripe reports.
        Criteria which = Criteria.where("_id")
                .is(orderId)
                .orOperator(
                        Criteria.where("refund.refundId").is(refundId),
                        Criteria.where("refund.refundId").exists(false),
                        Criteria.where("refund.refundId").is(null));
        Instant now = clock.instant();
        if ("succeeded".equals(status)) {
            MerchOrder updated = mongoTemplate.findAndModify(
                    Query.query(which.and("refund.status").ne(OrderRefundStatus.REFUNDED)),
                    new Update()
                            .set("refund.refundId", refundId)
                            .set("refund.status", OrderRefundStatus.REFUNDED)
                            .set("refund.completedAt", now)
                            .set("refundedAt", now),
                    FindAndModifyOptions.options().returnNew(true),
                    MerchOrder.class);
            if (updated != null) {
                metrics.refundSucceeded();
                log.info("Refund {} of order {} completed", refundId, orderId);
            }
        } else if ("failed".equals(status) || "canceled".equals(status)) {
            MerchOrder updated = mongoTemplate.findAndModify(
                    Query.query(which.and("refund.status").ne(OrderRefundStatus.FAILED)),
                    new Update()
                            .set("refund.refundId", refundId)
                            .set("refund.status", OrderRefundStatus.FAILED)
                            .set("refund.failureReason", failureReason),
                    FindAndModifyOptions.options().returnNew(true),
                    MerchOrder.class);
            if (updated != null) {
                metrics.refundFailed();
                log.error(
                        "ALERT refund {} of order {} {} at Stripe ({}); resolve it by hand",
                        refundId,
                        orderId,
                        status,
                        failureReason);
            }
        }
    }

    @Override
    public int expireLapsedHolds() {
        // Stripe keeps the session payable for the margin after the hold: wait for it to close first.
        Instant cutoff = clock.instant().minus(OrderRules.CHECKOUT_EXPIRY_MARGIN);
        Query lapsed = Query.query(Criteria.where("status")
                        .is(OrderStatus.AWAITING_PAYMENT)
                        .and("holdExpiresAt")
                        .lt(cutoff)
                        .and("payment.unconfirmedAlertedAt")
                        .exists(false))
                .limit(SWEEP_BATCH);
        int expired = 0;
        for (MerchOrder order : mongoTemplate.find(lapsed, MerchOrder.class)) {
            String sessionId =
                    order.getPayment() == null ? null : order.getPayment().getCheckoutSessionId();
            CheckoutStatus atStripe;
            try {
                atStripe = sessionId == null ? CheckoutStatus.EXPIRED : paymentGateway.checkoutStatus(sessionId);
            } catch (PaymentGatewayException unknown) {
                if (order.getHoldExpiresAt().isBefore(clock.instant().minus(UNKNOWN_STATE_ALERT_AFTER))) {
                    alertUnconfirmedPayment(order, "UNKNOWN");
                    continue;
                }
                // Never expire a hold that may have been paid; the next sweep asks again.
                log.warn("Hold of order {} kept: Stripe could not be asked ({})", order.getId(), unknown.getMessage());
                continue;
            }
            if (atStripe == CheckoutStatus.PAID || atStripe == CheckoutStatus.PROCESSING) {
                alertUnconfirmedPayment(order, atStripe);
            } else if (expire(
                    Criteria.where("_id").is(order.getId()).and("holdExpiresAt").lt(cutoff))) {
                expired++;
            }
        }
        metrics.holdsActive(unpaidCount(new Criteria()));
        return expired;
    }

    /** A paid session with no webhook: keep the stock held, record it once, and raise it for the organiser. */
    private void alertUnconfirmedPayment(MerchOrder order, Object atStripe) {
        boolean first = mongoTemplate
                        .updateFirst(
                                Query.query(Criteria.where("_id")
                                        .is(order.getId())
                                        .and("payment.unconfirmedAlertedAt")
                                        .exists(false)),
                                Update.update("payment.unconfirmedAlertedAt", clock.instant()),
                                MerchOrder.class)
                        .getModifiedCount()
                == 1;
        if (first) {
            metrics.paymentUnconfirmed();
            log.error(
                    "ALERT order {} is {} at Stripe but no webhook confirmed it: check the shop webhook endpoint and"
                            + " resend the event, or resolve it by hand. Its stock stays held.",
                    order.getId(),
                    atStripe);
        }
    }

    private boolean alreadyPaid(MerchOrder order) {
        try {
            CheckoutStatus atStripe =
                    paymentGateway.checkoutStatus(order.getPayment().getCheckoutSessionId());
            return atStripe == CheckoutStatus.PAID || atStripe == CheckoutStatus.PROCESSING;
        } catch (PaymentGatewayException unknown) {
            log.warn("Could not ask Stripe about order {}: {}", order.getId(), unknown.getMessage());
            return false;
        }
    }

    /** Ends one unpaid hold; the guard on its status makes the stock go back exactly once. */
    private boolean expire(Criteria which) {
        Instant now = clock.instant();
        MerchOrder expired = mongoTemplate.findAndModify(
                Query.query(which.and("status").is(OrderStatus.AWAITING_PAYMENT)),
                new Update()
                        .set("status", OrderStatus.EXPIRED)
                        .set("payment.status", OrderPaymentStatus.FAILED)
                        .set("expiredAt", now)
                        .set("retainUntil", now.plus(OrderRules.EXPIRED_RETENTION))
                        .unset("holdExpiresAt")
                        .unset("clientIp")
                        .unset("emailSlot")
                        .unset("ipSlot"),
                FindAndModifyOptions.options().returnNew(true),
                MerchOrder.class);
        if (expired == null) {
            return false;
        }
        ledger.releaseAll(stockLines(expired.getLines()));
        metrics.expired();
        log.info("Order {} expired unpaid; its stock is released", expired.getId());
        return true;
    }

    /**
     * Moves an order out of {@code from}.
     *
     * @return the order as it was before the update, with its access key; null when it was no longer in {@code from}
     */
    private MerchOrder move(String orderId, OrderStatus from, Update update) {
        return mongoTemplate.findAndModify(
                Query.query(Criteria.where("_id").is(orderId).and("status").is(from)),
                update,
                FindAndModifyOptions.options().returnNew(false),
                MerchOrder.class);
    }

    private Update confirmation(String paymentIntentId) {
        return paid(new Update(), paymentIntentId, clock.instant())
                .set("status", OrderStatus.CONFIRMED)
                .unset("accessKey");
    }

    /** The payment fields of a paid order, and its six-year retention (FR-022). */
    private static Update paid(Update update, String paymentIntentId, Instant now) {
        return update.set("payment.status", OrderPaymentStatus.PAID)
                .set("payment.paymentIntentId", paymentIntentId)
                .set("payment.paidAt", now)
                .set(
                        "retainUntil",
                        now.atZone(ZoneOffset.UTC)
                                .plusYears(OrderRules.PAID_RETENTION_YEARS)
                                .toInstant())
                .unset("holdExpiresAt")
                .unset("clientIp")
                .unset("emailSlot")
                .unset("ipSlot");
    }

    private void afterConfirmed(MerchOrder before) {
        metrics.confirmed();
        log.info("Order {} confirmed", before.getId());
        mailSender.send(OrderMails.confirmed(before, orderLink(before)));
    }

    /** The order page; with its key in the fragment, which browsers never send to a server (research R6). */
    private String orderLink(MerchOrder order) {
        String page = siteUrl + "/shop/orders/" + order.getId();
        return order.getAccessKey() == null ? page : page + "#key=" + order.getAccessKey();
    }

    /** The order a Stripe event names, or null when it is unknown or the event is for another session. */
    private MerchOrder findForSession(String orderId, String checkoutSessionId) {
        MerchOrder order = orderId == null ? null : mongoTemplate.findById(orderId, MerchOrder.class);
        if (order == null) {
            log.warn("Stripe event names order {}, which does not exist", orderId);
            return null;
        }
        String stored = order.getPayment() == null ? null : order.getPayment().getCheckoutSessionId();
        if (stored != null && !Objects.equals(stored, checkoutSessionId)) {
            log.warn("Stripe event for order {} names session {}, not its own session", orderId, checkoutSessionId);
            return null;
        }
        return order;
    }

    // ---- Helpers --------------------------------------------------------------------------------------------------

    private int deliveryFeeCents() {
        ShopSettings settings = mongoTemplate.findById(ShopSettings.ID, ShopSettings.class);
        return settings == null ? 0 : settings.getDeliveryFeeCents();
    }

    private static OrderLine toLine(OrderLineCommand line, ProductOffer offer) {
        return OrderLine.builder()
                .productId(offer.id())
                .productName(offer.name())
                .kind(offer.kind())
                .sizeId(line.sizeId())
                .quantity(line.quantity())
                .unitPriceCents(offer.priceCents())
                .photo(offer.photo())
                .build();
    }

    private MerchOrder newOrder(
            List<OrderLine> lines,
            int deliveryCents,
            String email,
            DeliveryAddressDto address,
            String clientIp,
            String key) {
        Instant now = clock.instant();
        int items = OrderRules.itemsCents(lines);
        return MerchOrder.builder()
                .accessKeyHash(OrderAccessKeys.hash(key))
                .accessKey(key)
                .status(OrderStatus.AWAITING_PAYMENT)
                .lines(new ArrayList<>(lines))
                .itemsCents(items)
                .deliveryCents(deliveryCents)
                .totalCents(OrderRules.totalCents(items, deliveryCents))
                .email(email)
                .address(DeliveryAddress.builder()
                        .name(address.name().trim())
                        .line1(address.line1().trim())
                        .line2(blankToNull(address.line2()))
                        .town(address.town().trim())
                        .county(address.county().trim())
                        .postcode(
                                address.postcode() == null || address.postcode().isBlank()
                                        ? null
                                        : address.postcode().trim().toUpperCase(Locale.ROOT))
                        .country(address.country().trim().toUpperCase(Locale.ROOT))
                        .phone(blankToNull(address.phone()))
                        .build())
                .holdExpiresAt(now.plus(limits.hold()))
                .payment(OrderPayment.builder()
                        .status(OrderPaymentStatus.PENDING)
                        .build())
                .clientIp(clientIp)
                .createdOnUtc(now)
                .build();
    }

    private ShopCheckoutRequest checkoutRequest(MerchOrder order) {
        String id = order.getId();
        String page = siteUrl + "/shop/orders/" + id;
        return new ShopCheckoutRequest(
                id,
                order.getNumber(),
                order.getLines().stream()
                        .map(line ->
                                new ShopLineItem(OrderRules.label(line), line.getUnitPriceCents(), line.getQuantity()))
                        .toList(),
                order.getDeliveryCents(),
                order.getCurrency(),
                order.getEmail(),
                toDto(order.getAddress()),
                order.getHoldExpiresAt().plus(OrderRules.CHECKOUT_EXPIRY_MARGIN),
                page + "?checkout=complete",
                page + "?checkout=cancelled",
                "order-checkout-" + id + "-1");
    }

    private static String refundKey(String orderId) {
        return "order-refund-" + orderId + "-1";
    }

    private static List<StockLine> stockLines(List<OrderLine> lines) {
        return lines.stream()
                .map(line -> new StockLine(line.getProductId(), line.getSizeId(), line.getQuantity()))
                .toList();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    static OrderDto toDto(MerchOrder order) {
        return new OrderDto(
                order.getId(),
                order.getNumber(),
                order.getStatus(),
                order.getLines().stream()
                        .map(line -> new OrderLineDto(
                                line.getProductId(),
                                line.getProductName(),
                                line.getKind(),
                                line.getSizeId(),
                                line.getQuantity(),
                                line.getUnitPriceCents(),
                                line.lineCents(),
                                line.getPhoto()))
                        .toList(),
                order.getItemsCents(),
                order.getDeliveryCents(),
                order.getTotalCents(),
                order.getCurrency(),
                order.getEmail(),
                toDto(order.getAddress()),
                order.getCreatedOnUtc(),
                order.getHoldExpiresAt(),
                order.getPayment() == null ? null : order.getPayment().getPaidAt(),
                order.getDispatch() == null
                        ? null
                        : new OrderDispatchDto(
                                order.getDispatch().getDispatchedAt(),
                                order.getDispatch().getTrackingReference()),
                order.getRefund() == null ? null : order.getRefund().getStatus());
    }

    private static DeliveryAddressDto toDto(DeliveryAddress address) {
        return new DeliveryAddressDto(
                address.getName(),
                address.getLine1(),
                address.getLine2(),
                address.getTown(),
                address.getCounty(),
                address.getPostcode(),
                address.getCountry(),
                address.getPhone());
    }
}
