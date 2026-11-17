package com.bjjeire.api.registration;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionDto;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionService;
import com.bjjeire.api.bjjeirecompetition.DivisionDto;
import com.bjjeire.api.bjjeirecompetition.RegistrationState;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.competitor.CompetitorIdentity;
import com.bjjeire.api.competitor.CompetitorService;
import com.bjjeire.api.competitor.CompetitorServiceImpl;
import com.bjjeire.api.competitor.Eligibility;
import com.bjjeire.api.competitor.SignUpProfile;
import com.bjjeire.api.config.BjjEireProperties;
import com.bjjeire.api.registration.PaymentGateway.CheckoutRequest;
import com.bjjeire.api.registration.PaymentGateway.CheckoutSession;
import com.bjjeire.api.registration.PaymentGateway.CheckoutStatus;
import com.bjjeire.api.registration.PaymentGateway.PaymentGatewayException;
import com.bjjeire.api.registration.PaymentGateway.RefundRequest;
import com.bjjeire.api.registration.PaymentGateway.RefundResult;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Mongo and Stripe implementation of {@link RegistrationService}. */
@Slf4j
@Service
public class RegistrationServiceImpl implements RegistrationService {
    private static final int SWEEP_BATCH = 200;
    static final String REFUND_FAILURE_METRIC = RegistrationMetrics.REFUND_FAILED;
    static final String UNCONFIRMED_PAYMENT_METRIC = RegistrationMetrics.PAYMENT_UNCONFIRMED;
    private static final Duration UNKNOWN_STATE_ALERT_AFTER = Duration.ofHours(24);

    private static final String UNPAID_SLOT_INDEX = "ux_registration_unpaid_slot";

    private final MongoTemplate mongoTemplate;
    private final BjjEireCompetitionService bjjEireCompetitionService;
    private final CompetitorService competitorService;
    private final PaymentGateway paymentGateway;
    private final RegistrationSupport support;
    private final AuditInfoProvider auditInfoProvider;
    private final ApiCache cache;
    private final Clock clock;
    private final Duration hold;
    private final String siteUrl;
    private final RegistrationMetrics metrics;

    public RegistrationServiceImpl(
            MongoTemplate mongoTemplate,
            BjjEireCompetitionService bjjEireCompetitionService,
            CompetitorService competitorService,
            PaymentGateway paymentGateway,
            RegistrationSupport support,
            AuditInfoProvider auditInfoProvider,
            ApiCache cache,
            Clock clock,
            BjjEireProperties properties,
            RegistrationMetrics metrics) {
        this.mongoTemplate = mongoTemplate;
        this.bjjEireCompetitionService = bjjEireCompetitionService;
        this.competitorService = competitorService;
        this.paymentGateway = paymentGateway;
        this.support = support;
        this.auditInfoProvider = auditInfoProvider;
        this.cache = cache;
        this.clock = clock;
        this.hold = properties.registration().hold();
        this.siteUrl = properties.stripe().successUrlBase();
        this.metrics = metrics;
    }

    // ---- Sign-up --------------------------------------------------------------------------------------------------

    @Override
    public RegistrationCheckoutDto create(CompetitorIdentity caller, CreateRegistrationCommand command) {
        BjjEireCompetitionDto competition =
                bjjEireCompetitionService.getPublicById(command.competitionId()).orElseThrow(ApiProblems::notFound);
        DivisionDto division =
                RegistrationSupport.division(competition, command.divisionId()).orElseThrow(ApiProblems::notFound);
        RegistrationState state = competition.registrationState();
        if (state != RegistrationState.OPEN && state != RegistrationState.FULL) {
            throw ApiProblems.conflict(
                    ProblemTypes.REGISTRATION_NOT_OPEN, "Registration for this competition is not open.");
        }

        SignUpProfile profile = competitorService
                .findSignUpProfile(caller)
                .filter(SignUpProfile::profileComplete)
                .orElseThrow(CompetitorServiceImpl::profileIncomplete);
        if (!Eligibility.isAdultOn(profile.dateOfBirth(), competition.date())) {
            throw CompetitorServiceImpl.underEighteen();
        }
        if (!Eligibility.isEligible(
                profile.gender(), profile.belt(), profile.dateOfBirth(), division, competition.date())) {
            throw ApiProblems.conflict(
                    ProblemTypes.NOT_ELIGIBLE,
                    "This division is not open to you: it is for another gender or belt, or an older age category.");
        }
        if (state == RegistrationState.FULL) {
            throw full();
        }
        if (hasActive(profile.competitorId(), competition.id(), division.id())) {
            throw alreadyRegistered();
        }
        if (unpaidCount(profile.competitorId(), competition.id()) >= RegistrationRules.MAX_UNPAID_PER_COMPETITION) {
            throw tooManyUnpaid();
        }

        if (!bjjEireCompetitionService.takePlace(competition.id())) {
            throw full();
        }
        BjjEireCompetitionRegistration registration =
                insertHoldingASlot(newRegistration(competition, division, profile));

        CheckoutSession session;
        try {
            session = paymentGateway.createCheckout(checkoutRequest(competition, division, profile, registration));
        } catch (PaymentGatewayException failed) {
            // Nothing reached Stripe that can be paid: forget the sign-up and give the place back.
            mongoTemplate.remove(
                    Query.query(Criteria.where("_id").is(registration.getId())), BjjEireCompetitionRegistration.class);
            bjjEireCompetitionService.releasePlace(competition.id());
            log.error(
                    "Checkout for registration {} could not be created: {}", registration.getId(), failed.getMessage());
            throw ApiProblems.badGateway(
                    ProblemTypes.PAYMENT_UNAVAILABLE,
                    "Payment is unavailable right now. Nothing was charged; please try again shortly.");
        }
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getId())),
                new Update().set("payment.checkoutSessionId", session.id()).set("payment.checkoutUrl", session.url()),
                BjjEireCompetitionRegistration.class);
        support.afterWrite(AuditAction.Create, registration.getId());
        metrics.signUpStarted();
        log.info(
                "Sign-up {} started for competition {} division {}",
                registration.getId(),
                competition.id(),
                division.id());
        return new RegistrationCheckoutDto(registration.getId(), session.url(), registration.getHoldExpiresAt());
    }

    /**
     * Inserts the sign-up in a free unpaid slot, 0 then 1. The two partial unique indexes make both limits hold under
     * concurrency: one active sign-up per division (FR-020) and two unpaid per competition (FR-041). Gives the place
     * back when neither is free.
     */
    private BjjEireCompetitionRegistration insertHoldingASlot(BjjEireCompetitionRegistration registration) {
        for (int slot = 0; slot < RegistrationRules.MAX_UNPAID_PER_COMPETITION; slot++) {
            try {
                return mongoTemplate.insert(
                        registration.toBuilder().unpaidSlot(slot).build());
            } catch (DuplicateKeyException taken) {
                if (!String.valueOf(taken.getMessage()).contains(UNPAID_SLOT_INDEX)) {
                    // The same competitor started this division at the same moment.
                    bjjEireCompetitionService.releasePlace(registration.getCompetitionId());
                    throw alreadyRegistered();
                }
            }
        }
        bjjEireCompetitionService.releasePlace(registration.getCompetitionId());
        throw tooManyUnpaid();
    }

    @Override
    public RegistrationCheckoutDto resumeCheckout(CompetitorIdentity caller, String registrationId) {
        BjjEireCompetitionRegistration registration = support.owned(caller, registrationId);
        Instant now = clock.instant();
        boolean awaiting = registration.getStatus() == RegistrationStatus.AWAITING_PAYMENT
                && registration.getPayment() != null
                && registration.getPayment().getCheckoutSessionId() != null;
        // Asked before the hold check: a payment whose webhook is late is still a payment, however long ago.
        if (awaiting && alreadyPaid(registration)) {
            // Sending them back would only show Stripe's "already paid" page.
            throw ApiProblems.conflict(
                    ProblemTypes.PAYMENT_RECEIVED,
                    "Your payment was received. Your sign-up is being confirmed and will show as confirmed shortly.");
        }
        if (!awaiting
                || registration.getHoldExpiresAt() == null
                || !now.isBefore(registration.getHoldExpiresAt())
                || registration.getPayment().getCheckoutUrl() == null) {
            throw ApiProblems.conflict(
                    ProblemTypes.HOLD_EXPIRED,
                    "This sign-up is no longer waiting for payment. Start a new sign-up if you still want to enter.");
        }
        // The open session, not a new one: one sign-up never has two payable checkouts (FR-020, SC-004).
        return new RegistrationCheckoutDto(
                registration.getId(), registration.getPayment().getCheckoutUrl(), registration.getHoldExpiresAt());
    }

    // ---- Reads ----------------------------------------------------------------------------------------------------

    @Override
    public List<RegistrationDto> getOwn(CompetitorIdentity caller) {
        Optional<SignUpProfile> profile = competitorService.findSignUpProfile(caller);
        if (profile.isEmpty()) {
            return List.of();
        }
        Query query = Query.query(
                        Criteria.where("competitorId").is(profile.get().competitorId()))
                .with(Sort.by(Sort.Order.desc("createdAt")));
        List<BjjEireCompetitionRegistration> registrations =
                mongoTemplate.find(query, BjjEireCompetitionRegistration.class);
        Map<String, Optional<BjjEireCompetitionDto>> competitions = new HashMap<>();
        List<RegistrationDto> result = new ArrayList<>();
        for (BjjEireCompetitionRegistration registration : registrations) {
            Optional<BjjEireCompetitionDto> competition = competitions.computeIfAbsent(
                    registration.getCompetitionId(), bjjEireCompetitionService::getForAdmin);
            result.add(support.toDto(registration, competition.orElse(null)));
        }
        return result;
    }

    @Override
    public List<DivisionCompetitorsDto> getListedCompetitors(String competitionId) {
        BjjEireCompetitionDto competition =
                bjjEireCompetitionService.getPublicById(competitionId).orElseThrow(ApiProblems::notFound);
        return cache.getOrCreate(
                ApiCache.BJJEIRE_COMPETITIONS_TAG,
                "BjjEireCompetition_Competitors_" + competitionId,
                () -> listed(competition));
    }

    private List<DivisionCompetitorsDto> listed(BjjEireCompetitionDto competition) {
        Query query = Query.query(Criteria.where("competitionId")
                .is(competition.id())
                .and("status")
                .is(RegistrationStatus.CONFIRMED));
        Map<String, List<ListedCompetitorDto>> byDivision = new LinkedHashMap<>();
        competition.divisions().forEach(division -> byDivision.put(division.id(), new ArrayList<>()));
        mongoTemplate.find(query, BjjEireCompetitionRegistration.class).stream()
                .sorted(Comparator.comparing(
                        BjjEireCompetitionRegistration::getDisplayName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .forEach(registration -> {
                    List<ListedCompetitorDto> list = byDivision.get(registration.getDivisionId());
                    if (list != null) {
                        list.add(new ListedCompetitorDto(
                                registration.getDisplayName(),
                                registration.getAcademy() == null
                                        ? null
                                        : registration.getAcademy().name(),
                                registration.getAffiliation()));
                    }
                });
        return byDivision.entrySet().stream()
                .map(entry -> new DivisionCompetitorsDto(entry.getKey(), List.copyOf(entry.getValue())))
                .toList();
    }

    // ---- Stripe ---------------------------------------------------------------------------------------------------

    @Override
    public void onCheckoutPaid(String registrationId, String checkoutSessionId, String paymentIntentId) {
        BjjEireCompetitionRegistration registration = findForSession(registrationId, checkoutSessionId);
        if (registration == null) {
            return;
        }
        switch (registration.getStatus()) {
            case CONFIRMED, CANCELLED -> log.info("Payment for registration {} already handled", registrationId);
            case AWAITING_PAYMENT -> {
                BjjEireCompetitionRegistration confirmed =
                        confirm(registrationId, RegistrationStatus.AWAITING_PAYMENT, paymentIntentId);
                if (confirmed == null) {
                    // The sweep or the expiry event ended the hold a moment ago; treat it as a late payment.
                    onCheckoutPaid(registrationId, checkoutSessionId, paymentIntentId);
                    return;
                }
                afterConfirmed(confirmed);
            }
            case EXPIRED -> lateConfirmOrRefund(registration, paymentIntentId);
            default -> throw new IllegalStateException("Unknown status " + registration.getStatus());
        }
    }

    private void lateConfirmOrRefund(BjjEireCompetitionRegistration registration, String paymentIntentId) {
        if (registration.getRefund() != null) {
            // A refund was already tried and may have gone through at Stripe even if we saw it fail. Never confirm
            // after that: finish the refund with the same idempotency key (FR-020, SC-004).
            refundLatePayment(registration, paymentIntentId);
            return;
        }
        if (bjjEireCompetitionService.takePlace(registration.getCompetitionId())) {
            BjjEireCompetitionRegistration confirmed;
            try {
                confirmed = confirm(registration.getId(), RegistrationStatus.EXPIRED, paymentIntentId);
            } catch (DuplicateKeyException alreadyEntered) {
                // The competitor started a new sign-up for this division after the hold lapsed.
                confirmed = null;
            }
            if (confirmed != null) {
                log.info("Late payment for registration {} confirmed with a free place", registration.getId());
                afterConfirmed(confirmed);
                return;
            }
            bjjEireCompetitionService.releasePlace(registration.getCompetitionId());
            BjjEireCompetitionRegistration current =
                    mongoTemplate.findById(registration.getId(), BjjEireCompetitionRegistration.class);
            if (current == null || current.getStatus() != RegistrationStatus.EXPIRED) {
                return;
            }
        }
        refundLatePayment(registration, paymentIntentId);
    }

    private void refundLatePayment(BjjEireCompetitionRegistration registration, String paymentIntentId) {
        int amount = registration.getPayment().getAmountCents();
        // Throws on failure: the webhook answers 5xx and Stripe retries; the idempotency key prevents a second refund.
        RefundResult refund;
        metrics.refundRequested();
        try {
            refund = paymentGateway.refund(
                    new RefundRequest(registration.getId(), paymentIntentId, amount, "refund-" + registration.getId()));
        } catch (PaymentGatewayException failed) {
            recordFailedRefund(registration, paymentIntentId, amount, failed);
            throw failed;
        }
        Instant now = clock.instant();
        Update update = support.audited(new Update()
                .set("status", RegistrationStatus.CANCELLED)
                .unset("active")
                .unset("holdExpiresAt")
                .unset("unpaidSlot")
                .set("payment.status", PaymentStatus.PAID)
                .set("payment.paymentIntentId", paymentIntentId)
                .set("payment.paidAt", now)
                .set("cancelledAt", now)
                .set("cancelledBy", BjjEireCompetitionRegistration.CANCELLED_BY_SYSTEM)
                .set(
                        "refund",
                        Refund.builder()
                                .refundId(refund.refundId())
                                .amountCents(amount)
                                .attempts(1)
                                .status(refund.succeeded() ? RefundStatus.REFUNDED : RefundStatus.PENDING)
                                .requestedAt(now)
                                .completedAt(refund.succeeded() ? now : null)
                                .build()));
        BjjEireCompetitionRegistration cancelled = mongoTemplate.findAndModify(
                Query.query(Criteria.where("_id")
                        .is(registration.getId())
                        .and("status")
                        .is(RegistrationStatus.EXPIRED)),
                update,
                FindAndModifyOptions.options().returnNew(true),
                BjjEireCompetitionRegistration.class);
        if (cancelled == null) {
            return;
        }
        support.afterWrite(AuditAction.Update, cancelled.getId());
        if (refund.succeeded()) {
            metrics.refundSucceeded();
        }
        log.warn(
                "Late payment for registration {} refunded in full: no place left in competition {}",
                cancelled.getId(),
                cancelled.getCompetitionId());
        support.mail(
                cancelled,
                (to, competition, division) -> RegistrationMails.refundedNoPlace(to, competition, division, amount));
    }

    /**
     * Keeps a record that the money was taken and the refund failed, so the organiser sees it (spec edge case: "refund
     * pending", organiser alerted). The webhook then answers 5xx and Stripe's retry tries the same refund again.
     */
    private void recordFailedRefund(
            BjjEireCompetitionRegistration registration, String paymentIntentId, int amount, RuntimeException failed) {
        Instant now = clock.instant();
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id")
                        .is(registration.getId())
                        .and("status")
                        .is(RegistrationStatus.EXPIRED)),
                support.audited(new Update()
                        .set("payment.status", PaymentStatus.PAID)
                        .set("payment.paymentIntentId", paymentIntentId)
                        .set("payment.paidAt", now)
                        .set(
                                "refund",
                                Refund.builder()
                                        .amountCents(amount)
                                        .attempts(1)
                                        .status(RefundStatus.FAILED)
                                        .requestedAt(now)
                                        .failureReason(failed.getMessage())
                                        .build())),
                BjjEireCompetitionRegistration.class);
        metrics.refundFailed();
        log.error(
                "ALERT refund of registration {} ({} cents) failed and must be resolved by hand if Stripe's retries also"
                        + " fail: {}",
                registration.getId(),
                amount,
                failed.getMessage());
    }

    @Override
    public void onCheckoutExpired(String registrationId, String checkoutSessionId) {
        BjjEireCompetitionRegistration registration = findForSession(registrationId, checkoutSessionId);
        if (registration != null) {
            expire(Criteria.where("_id").is(registrationId));
        }
    }

    @Override
    public int expireLapsedHolds() {
        // Stripe keeps the session payable for the margin after the hold: wait for it to close first.
        Instant cutoff = clock.instant().minus(RegistrationRules.CHECKOUT_EXPIRY_MARGIN);
        Query lapsed = Query.query(Criteria.where("status")
                        .is(RegistrationStatus.AWAITING_PAYMENT)
                        .and("holdExpiresAt")
                        .lt(cutoff)
                        .and("payment.unconfirmedAlertedAt")
                        .exists(false))
                .limit(SWEEP_BATCH);
        int expired = 0;
        for (BjjEireCompetitionRegistration registration :
                mongoTemplate.find(lapsed, BjjEireCompetitionRegistration.class)) {
            String sessionId = registration.getPayment() == null
                    ? null
                    : registration.getPayment().getCheckoutSessionId();
            CheckoutStatus atStripe;
            try {
                atStripe = sessionId == null ? CheckoutStatus.EXPIRED : paymentGateway.checkoutStatus(sessionId);
            } catch (PaymentGatewayException unknown) {
                if (registration.getHoldExpiresAt().isBefore(clock.instant().minus(UNKNOWN_STATE_ALERT_AFTER))) {
                    // Still unknown a day on: hand it to the organiser and stop asking, so it cannot crowd out the
                    // other lapsed holds in each batch.
                    alertUnconfirmedPayment(registration, "UNKNOWN");
                    continue;
                }
                // Never expire a hold that may have been paid; the next sweep asks again.
                log.warn(
                        "Hold of registration {} kept: Stripe could not be asked ({})",
                        registration.getId(),
                        unknown.getMessage());
                continue;
            }
            if (atStripe == CheckoutStatus.PAID || atStripe == CheckoutStatus.PROCESSING) {
                alertUnconfirmedPayment(registration, atStripe);
            } else if (expire(Criteria.where("_id")
                    .is(registration.getId())
                    .and("holdExpiresAt")
                    .lt(cutoff))) {
                expired++;
            }
        }
        return expired;
    }

    @Override
    public int endHolds(String competitionId) {
        Query holds = Query.query(Criteria.where("competitionId")
                .is(competitionId)
                .and("status")
                .is(RegistrationStatus.AWAITING_PAYMENT));
        int ended = 0;
        for (BjjEireCompetitionRegistration registration :
                mongoTemplate.find(holds, BjjEireCompetitionRegistration.class)) {
            if (expire(Criteria.where("_id").is(registration.getId()))) {
                ended++;
            }
        }
        return ended;
    }

    // ---- Change division ------------------------------------------------------------------------------------------

    @Override
    public RegistrationDto changeOwnDivision(
            CompetitorIdentity caller, String registrationId, ChangeDivisionCommand command) {
        BjjEireCompetitionRegistration registration = support.owned(caller, registrationId);
        BjjEireCompetitionDto competition = bjjEireCompetitionService
                .getForAdmin(registration.getCompetitionId())
                .orElseThrow(ApiProblems::notFound);
        DivisionDto target =
                RegistrationSupport.division(competition, command.divisionId()).orElseThrow(ApiProblems::notFound);
        if (registration.getStatus() != RegistrationStatus.CONFIRMED) {
            throw ApiProblems.conflict(ProblemTypes.CONFLICT, "Only a confirmed sign-up can change division.");
        }
        support.refuseIfMedallist(registration);
        RegistrationState state = competition.registrationState();
        if (state != RegistrationState.OPEN && state != RegistrationState.FULL) {
            throw ApiProblems.conflict(
                    ProblemTypes.REGISTRATION_CLOSED,
                    "Registration has closed, so you can no longer change division yourself. Please contact the"
                            + " organiser.");
        }
        if (target.id().equals(registration.getDivisionId())) {
            return support.toDto(registration, competition);
        }
        SignUpProfile profile = competitorService
                .findSignUpProfile(caller)
                .filter(SignUpProfile::profileComplete)
                .orElseThrow(CompetitorServiceImpl::profileIncomplete);
        if (!Eligibility.isEligible(
                profile.gender(), profile.belt(), profile.dateOfBirth(), target, competition.date())) {
            throw ApiProblems.conflict(
                    ProblemTypes.NOT_ELIGIBLE,
                    "This division is not open to you: it is for another gender or belt, or an older age category.");
        }
        BjjEireCompetitionRegistration moved = support.move(registration, target.id(), false);
        log.info("Sign-up {} moved by its competitor to division {}", moved.getId(), target.id());
        return support.toDto(moved, competition);
    }

    /** A paid session with no webhook: keep the place, record it once, and raise it for the organiser. */
    private void alertUnconfirmedPayment(BjjEireCompetitionRegistration registration, Object atStripe) {
        boolean first = mongoTemplate
                        .updateFirst(
                                Query.query(Criteria.where("_id")
                                        .is(registration.getId())
                                        .and("payment.unconfirmedAlertedAt")
                                        .exists(false)),
                                Update.update("payment.unconfirmedAlertedAt", clock.instant()),
                                BjjEireCompetitionRegistration.class)
                        .getModifiedCount()
                == 1;
        if (first) {
            metrics.paymentUnconfirmed();
            log.error(
                    "ALERT registration {} is {} at Stripe but no webhook confirmed it: check the webhook endpoint and"
                            + " resend the event, or resolve it by hand (docs/stripe-local.md). Its place stays held.",
                    registration.getId(),
                    atStripe);
        }
    }

    /** Whether Stripe already took the money for this sign-up's session; false when it cannot say. */
    private boolean alreadyPaid(BjjEireCompetitionRegistration registration) {
        try {
            CheckoutStatus atStripe =
                    paymentGateway.checkoutStatus(registration.getPayment().getCheckoutSessionId());
            return atStripe == CheckoutStatus.PAID || atStripe == CheckoutStatus.PROCESSING;
        } catch (PaymentGatewayException unknown) {
            log.warn("Could not ask Stripe about registration {}: {}", registration.getId(), unknown.getMessage());
            return false;
        }
    }

    /** Ends one unpaid hold; the guard on its status makes the place go back exactly once. */
    private boolean expire(Criteria which) {
        Query query = Query.query(which.and("status").is(RegistrationStatus.AWAITING_PAYMENT));
        BjjEireCompetitionRegistration expired = mongoTemplate.findAndModify(
                query,
                support.audited(new Update()
                        .set("status", RegistrationStatus.EXPIRED)
                        .unset("active")
                        .unset("holdExpiresAt")
                        .unset("unpaidSlot")
                        .set("payment.status", PaymentStatus.FAILED)),
                FindAndModifyOptions.options().returnNew(true),
                BjjEireCompetitionRegistration.class);
        if (expired == null) {
            return false;
        }
        bjjEireCompetitionService.releasePlace(expired.getCompetitionId());
        support.afterWrite(AuditAction.Update, expired.getId());
        metrics.signUpExpired();
        log.info("Sign-up {} expired unpaid; its place is released", expired.getId());
        return true;
    }

    private BjjEireCompetitionRegistration confirm(
            String registrationId, RegistrationStatus from, String paymentIntentId) {
        Update update = support.audited(new Update()
                .set("status", RegistrationStatus.CONFIRMED)
                .set("active", Boolean.TRUE)
                .unset("holdExpiresAt")
                .unset("unpaidSlot")
                .set("payment.status", PaymentStatus.PAID)
                .set("payment.paymentIntentId", paymentIntentId)
                .set("payment.paidAt", clock.instant()));
        return mongoTemplate.findAndModify(
                Query.query(
                        Criteria.where("_id").is(registrationId).and("status").is(from)),
                update,
                FindAndModifyOptions.options().returnNew(true),
                BjjEireCompetitionRegistration.class);
    }

    private void afterConfirmed(BjjEireCompetitionRegistration confirmed) {
        support.afterWrite(AuditAction.Update, confirmed.getId());
        metrics.signUpConfirmed();
        log.info("Sign-up {} confirmed", confirmed.getId());
        int amount = confirmed.getPayment().getAmountCents();
        support.mail(
                confirmed,
                (to, competition, division) -> RegistrationMails.confirmed(to, competition, division, amount));
    }

    /** The sign-up a Stripe event names, or null when it is unknown or the event is for another session. */
    private BjjEireCompetitionRegistration findForSession(String registrationId, String checkoutSessionId) {
        BjjEireCompetitionRegistration registration = registrationId == null
                ? null
                : mongoTemplate.findById(registrationId, BjjEireCompetitionRegistration.class);
        if (registration == null) {
            log.warn("Stripe event names registration {}, which does not exist", registrationId);
            return null;
        }
        String stored = registration.getPayment() == null
                ? null
                : registration.getPayment().getCheckoutSessionId();
        if (stored != null && !Objects.equals(stored, checkoutSessionId)) {
            log.warn(
                    "Stripe event for registration {} names session {}, not its own session",
                    registrationId,
                    checkoutSessionId);
            return null;
        }
        return registration;
    }

    // ---- Helpers --------------------------------------------------------------------------------------------------

    private BjjEireCompetitionRegistration newRegistration(
            BjjEireCompetitionDto competition, DivisionDto division, SignUpProfile profile) {
        Instant now = clock.instant();
        return BjjEireCompetitionRegistration.builder()
                .competitionId(competition.id())
                .divisionId(division.id())
                .competitorId(profile.competitorId())
                .status(RegistrationStatus.AWAITING_PAYMENT)
                .active(Boolean.TRUE)
                .holdExpiresAt(RegistrationRules.holdExpiresAt(now, hold))
                .displayName(profile.displayName())
                .academy(profile.academy())
                .affiliation(profile.affiliation())
                .academyKey(TeamKeys.academyKey(profile.academy()))
                .affiliationKey(TeamKeys.affiliationKey(profile.affiliation()))
                .acceptedPublicListingAt(now)
                .acceptedTermsAt(now)
                .payment(Payment.builder()
                        .amountCents(competition.entryFeeCents())
                        .currency(competition.currency())
                        .status(PaymentStatus.PENDING)
                        .build())
                .createdOnUtc(auditInfoProvider.currentInstant())
                .createdBy(auditInfoProvider.currentUser())
                .build();
    }

    private CheckoutRequest checkoutRequest(
            BjjEireCompetitionDto competition,
            DivisionDto division,
            SignUpProfile profile,
            BjjEireCompetitionRegistration registration) {
        String id = registration.getId();
        String signUpPage =
                siteUrl + "/competitions/" + URLEncoder.encode(competition.slug(), StandardCharsets.UTF_8) + "/signup";
        return new CheckoutRequest(
                id,
                competition.id(),
                division.id(),
                competition.name() + " — " + RegistrationMails.label(division),
                registration.getPayment().getAmountCents(),
                registration.getPayment().getCurrency(),
                profile.email(),
                registration.getHoldExpiresAt().plus(RegistrationRules.CHECKOUT_EXPIRY_MARGIN),
                signUpPage + "/complete?registration=" + id,
                signUpPage + "?registration=" + id,
                "checkout-" + id + "-1");
    }

    private boolean hasActive(String competitorId, String competitionId, String divisionId) {
        return mongoTemplate.exists(
                Query.query(Criteria.where("competitorId")
                        .is(competitorId)
                        .and("competitionId")
                        .is(competitionId)
                        .and("divisionId")
                        .is(divisionId)
                        .and("active")
                        .is(true)),
                BjjEireCompetitionRegistration.class);
    }

    private long unpaidCount(String competitorId, String competitionId) {
        return mongoTemplate.count(
                Query.query(Criteria.where("competitorId")
                        .is(competitorId)
                        .and("competitionId")
                        .is(competitionId)
                        .and("status")
                        .is(RegistrationStatus.AWAITING_PAYMENT)),
                BjjEireCompetitionRegistration.class);
    }

    private static ResponseStatusException full() {
        return ApiProblems.conflict(
                ProblemTypes.COMPETITION_FULL, "This competition is full. You have not been charged.");
    }

    private static ResponseStatusException tooManyUnpaid() {
        return ApiProblems.conflict(
                ProblemTypes.TOO_MANY_UNPAID,
                "You already have two unpaid sign-ups in this competition. Pay for or cancel one first.");
    }

    private static ResponseStatusException alreadyRegistered() {
        return ApiProblems.conflict(
                ProblemTypes.ALREADY_REGISTERED,
                "You already have a sign-up in this division. You have not been charged again.");
    }
}
