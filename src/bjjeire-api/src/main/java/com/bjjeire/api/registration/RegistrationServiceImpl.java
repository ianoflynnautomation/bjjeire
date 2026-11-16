package com.bjjeire.api.registration;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
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
import com.bjjeire.api.tournament.DivisionDto;
import com.bjjeire.api.tournament.RegistrationState;
import com.bjjeire.api.tournament.TournamentDto;
import com.bjjeire.api.tournament.TournamentService;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
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
    static final String REFUND_FAILURE_METRIC = "registration.refund.failures";
    static final String UNCONFIRMED_PAYMENT_METRIC = "registration.payment.unconfirmed";
    private static final Duration UNKNOWN_STATE_ALERT_AFTER = Duration.ofHours(24);

    private static final String UNPAID_SLOT_INDEX = "ux_registration_unpaid_slot";

    private final MongoTemplate mongoTemplate;
    private final TournamentService tournamentService;
    private final CompetitorService competitorService;
    private final PaymentGateway paymentGateway;
    private final RegistrationSupport support;
    private final AuditInfoProvider auditInfoProvider;
    private final ApiCache cache;
    private final Clock clock;
    private final Duration hold;
    private final String siteUrl;
    private final Counter refundFailures;
    private final Counter unconfirmedPayments;

    public RegistrationServiceImpl(
            MongoTemplate mongoTemplate,
            TournamentService tournamentService,
            CompetitorService competitorService,
            PaymentGateway paymentGateway,
            RegistrationSupport support,
            AuditInfoProvider auditInfoProvider,
            ApiCache cache,
            Clock clock,
            BjjEireProperties properties,
            MeterRegistry meterRegistry) {
        this.mongoTemplate = mongoTemplate;
        this.tournamentService = tournamentService;
        this.competitorService = competitorService;
        this.paymentGateway = paymentGateway;
        this.support = support;
        this.auditInfoProvider = auditInfoProvider;
        this.cache = cache;
        this.clock = clock;
        this.hold = properties.registration().hold();
        this.siteUrl = properties.stripe().successUrlBase();
        this.refundFailures = Counter.builder(REFUND_FAILURE_METRIC)
                .description("Refunds Stripe refused or could not be reached for; the organiser resolves them by hand")
                .register(meterRegistry);
        this.unconfirmedPayments = Counter.builder(UNCONFIRMED_PAYMENT_METRIC)
                .description("Holds paid at Stripe with no confirming webhook when their hold ended")
                .register(meterRegistry);
    }

    // ---- Sign-up --------------------------------------------------------------------------------------------------

    @Override
    public RegistrationCheckoutDto create(CompetitorIdentity caller, CreateRegistrationCommand command) {
        TournamentDto tournament =
                tournamentService.getPublicById(command.tournamentId()).orElseThrow(ApiProblems::notFound);
        DivisionDto division =
                RegistrationSupport.division(tournament, command.divisionId()).orElseThrow(ApiProblems::notFound);
        RegistrationState state = tournament.registrationState();
        if (state != RegistrationState.OPEN && state != RegistrationState.FULL) {
            throw ApiProblems.conflict(
                    ProblemTypes.REGISTRATION_NOT_OPEN, "Registration for this tournament is not open.");
        }

        SignUpProfile profile = competitorService
                .findSignUpProfile(caller)
                .filter(SignUpProfile::profileComplete)
                .orElseThrow(CompetitorServiceImpl::profileIncomplete);
        if (!Eligibility.isAdultOn(profile.dateOfBirth(), tournament.date())) {
            throw CompetitorServiceImpl.underEighteen();
        }
        if (!Eligibility.isEligible(
                profile.gender(), profile.belt(), profile.dateOfBirth(), division, tournament.date())) {
            throw ApiProblems.conflict(
                    ProblemTypes.NOT_ELIGIBLE,
                    "This division is not open to you: it is for another gender or belt, or an older age category.");
        }
        if (state == RegistrationState.FULL) {
            throw full();
        }
        if (hasActive(profile.competitorId(), tournament.id(), division.id())) {
            throw alreadyRegistered();
        }
        if (unpaidCount(profile.competitorId(), tournament.id()) >= RegistrationRules.MAX_UNPAID_PER_TOURNAMENT) {
            throw tooManyUnpaid();
        }

        if (!tournamentService.takePlace(tournament.id())) {
            throw full();
        }
        TournamentRegistration registration = insertHoldingASlot(newRegistration(tournament, division, profile));

        CheckoutSession session;
        try {
            session = paymentGateway.createCheckout(checkoutRequest(tournament, division, profile, registration));
        } catch (PaymentGatewayException failed) {
            // Nothing reached Stripe that can be paid: forget the sign-up and give the place back.
            mongoTemplate.remove(
                    Query.query(Criteria.where("_id").is(registration.getId())), TournamentRegistration.class);
            tournamentService.releasePlace(tournament.id());
            log.error(
                    "Checkout for registration {} could not be created: {}", registration.getId(), failed.getMessage());
            throw ApiProblems.badGateway(
                    ProblemTypes.PAYMENT_UNAVAILABLE,
                    "Payment is unavailable right now. Nothing was charged; please try again shortly.");
        }
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(registration.getId())),
                new Update().set("payment.checkoutSessionId", session.id()).set("payment.checkoutUrl", session.url()),
                TournamentRegistration.class);
        support.afterWrite(AuditAction.Create, registration.getId());
        log.info(
                "Sign-up {} started for tournament {} division {}",
                registration.getId(),
                tournament.id(),
                division.id());
        return new RegistrationCheckoutDto(registration.getId(), session.url(), registration.getHoldExpiresAt());
    }

    /**
     * Inserts the sign-up in a free unpaid slot, 0 then 1. The two partial unique indexes make both limits hold under
     * concurrency: one active sign-up per division (FR-020) and two unpaid per tournament (FR-041). Gives the place
     * back when neither is free.
     */
    private TournamentRegistration insertHoldingASlot(TournamentRegistration registration) {
        for (int slot = 0; slot < RegistrationRules.MAX_UNPAID_PER_TOURNAMENT; slot++) {
            try {
                return mongoTemplate.insert(
                        registration.toBuilder().unpaidSlot(slot).build());
            } catch (DuplicateKeyException taken) {
                if (!String.valueOf(taken.getMessage()).contains(UNPAID_SLOT_INDEX)) {
                    // The same competitor started this division at the same moment.
                    tournamentService.releasePlace(registration.getTournamentId());
                    throw alreadyRegistered();
                }
            }
        }
        tournamentService.releasePlace(registration.getTournamentId());
        throw tooManyUnpaid();
    }

    @Override
    public RegistrationCheckoutDto resumeCheckout(CompetitorIdentity caller, String registrationId) {
        TournamentRegistration registration = support.owned(caller, registrationId);
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
        List<TournamentRegistration> registrations = mongoTemplate.find(query, TournamentRegistration.class);
        Map<String, Optional<TournamentDto>> tournaments = new HashMap<>();
        List<RegistrationDto> result = new ArrayList<>();
        for (TournamentRegistration registration : registrations) {
            Optional<TournamentDto> tournament =
                    tournaments.computeIfAbsent(registration.getTournamentId(), tournamentService::getForAdmin);
            result.add(support.toDto(registration, tournament.orElse(null)));
        }
        return result;
    }

    @Override
    public List<DivisionCompetitorsDto> getListedCompetitors(String tournamentId) {
        TournamentDto tournament = tournamentService.getPublicById(tournamentId).orElseThrow(ApiProblems::notFound);
        return cache.getOrCreate(
                ApiCache.TOURNAMENTS_TAG, "Tournament_Competitors_" + tournamentId, () -> listed(tournament));
    }

    private List<DivisionCompetitorsDto> listed(TournamentDto tournament) {
        Query query = Query.query(
                Criteria.where("tournamentId").is(tournament.id()).and("status").is(RegistrationStatus.CONFIRMED));
        Map<String, List<ListedCompetitorDto>> byDivision = new LinkedHashMap<>();
        tournament.divisions().forEach(division -> byDivision.put(division.id(), new ArrayList<>()));
        mongoTemplate.find(query, TournamentRegistration.class).stream()
                .sorted(Comparator.comparing(
                        TournamentRegistration::getDisplayName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
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
        TournamentRegistration registration = findForSession(registrationId, checkoutSessionId);
        if (registration == null) {
            return;
        }
        switch (registration.getStatus()) {
            case CONFIRMED, CANCELLED -> log.info("Payment for registration {} already handled", registrationId);
            case AWAITING_PAYMENT -> {
                TournamentRegistration confirmed =
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

    private void lateConfirmOrRefund(TournamentRegistration registration, String paymentIntentId) {
        if (registration.getRefund() != null) {
            // A refund was already tried and may have gone through at Stripe even if we saw it fail. Never confirm
            // after that: finish the refund with the same idempotency key (FR-020, SC-004).
            refundLatePayment(registration, paymentIntentId);
            return;
        }
        if (tournamentService.takePlace(registration.getTournamentId())) {
            TournamentRegistration confirmed;
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
            tournamentService.releasePlace(registration.getTournamentId());
            TournamentRegistration current = mongoTemplate.findById(registration.getId(), TournamentRegistration.class);
            if (current == null || current.getStatus() != RegistrationStatus.EXPIRED) {
                return;
            }
        }
        refundLatePayment(registration, paymentIntentId);
    }

    private void refundLatePayment(TournamentRegistration registration, String paymentIntentId) {
        int amount = registration.getPayment().getAmountCents();
        // Throws on failure: the webhook answers 5xx and Stripe retries; the idempotency key prevents a second refund.
        RefundResult refund;
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
                .set("cancelledBy", TournamentRegistration.CANCELLED_BY_SYSTEM)
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
        TournamentRegistration cancelled = mongoTemplate.findAndModify(
                Query.query(Criteria.where("_id")
                        .is(registration.getId())
                        .and("status")
                        .is(RegistrationStatus.EXPIRED)),
                update,
                FindAndModifyOptions.options().returnNew(true),
                TournamentRegistration.class);
        if (cancelled == null) {
            return;
        }
        support.afterWrite(AuditAction.Update, cancelled.getId());
        log.warn(
                "Late payment for registration {} refunded in full: no place left in tournament {}",
                cancelled.getId(),
                cancelled.getTournamentId());
        support.mail(
                cancelled,
                (to, tournament, division) -> RegistrationMails.refundedNoPlace(to, tournament, division, amount));
    }

    /**
     * Keeps a record that the money was taken and the refund failed, so the organiser sees it (spec edge case: "refund
     * pending", organiser alerted). The webhook then answers 5xx and Stripe's retry tries the same refund again.
     */
    private void recordFailedRefund(
            TournamentRegistration registration, String paymentIntentId, int amount, RuntimeException failed) {
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
                TournamentRegistration.class);
        refundFailures.increment();
        log.error(
                "ALERT refund of registration {} ({} cents) failed and must be resolved by hand if Stripe's retries also"
                        + " fail: {}",
                registration.getId(),
                amount,
                failed.getMessage());
    }

    @Override
    public void onCheckoutExpired(String registrationId, String checkoutSessionId) {
        TournamentRegistration registration = findForSession(registrationId, checkoutSessionId);
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
        for (TournamentRegistration registration : mongoTemplate.find(lapsed, TournamentRegistration.class)) {
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
    public int endHolds(String tournamentId) {
        Query holds = Query.query(
                Criteria.where("tournamentId").is(tournamentId).and("status").is(RegistrationStatus.AWAITING_PAYMENT));
        int ended = 0;
        for (TournamentRegistration registration : mongoTemplate.find(holds, TournamentRegistration.class)) {
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
        TournamentRegistration registration = support.owned(caller, registrationId);
        TournamentDto tournament =
                tournamentService.getForAdmin(registration.getTournamentId()).orElseThrow(ApiProblems::notFound);
        DivisionDto target =
                RegistrationSupport.division(tournament, command.divisionId()).orElseThrow(ApiProblems::notFound);
        if (registration.getStatus() != RegistrationStatus.CONFIRMED) {
            throw ApiProblems.conflict(ProblemTypes.CONFLICT, "Only a confirmed sign-up can change division.");
        }
        RegistrationState state = tournament.registrationState();
        if (state != RegistrationState.OPEN && state != RegistrationState.FULL) {
            throw ApiProblems.conflict(
                    ProblemTypes.REGISTRATION_CLOSED,
                    "Registration has closed, so you can no longer change division yourself. Please contact the"
                            + " organiser.");
        }
        if (target.id().equals(registration.getDivisionId())) {
            return support.toDto(registration, tournament);
        }
        SignUpProfile profile = competitorService
                .findSignUpProfile(caller)
                .filter(SignUpProfile::profileComplete)
                .orElseThrow(CompetitorServiceImpl::profileIncomplete);
        if (!Eligibility.isEligible(
                profile.gender(), profile.belt(), profile.dateOfBirth(), target, tournament.date())) {
            throw ApiProblems.conflict(
                    ProblemTypes.NOT_ELIGIBLE,
                    "This division is not open to you: it is for another gender or belt, or an older age category.");
        }
        TournamentRegistration moved = support.move(registration, target.id(), false);
        log.info("Sign-up {} moved by its competitor to division {}", moved.getId(), target.id());
        return support.toDto(moved, tournament);
    }

    /** A paid session with no webhook: keep the place, record it once, and raise it for the organiser. */
    private void alertUnconfirmedPayment(TournamentRegistration registration, Object atStripe) {
        boolean first = mongoTemplate
                        .updateFirst(
                                Query.query(Criteria.where("_id")
                                        .is(registration.getId())
                                        .and("payment.unconfirmedAlertedAt")
                                        .exists(false)),
                                Update.update("payment.unconfirmedAlertedAt", clock.instant()),
                                TournamentRegistration.class)
                        .getModifiedCount()
                == 1;
        if (first) {
            unconfirmedPayments.increment();
            log.error(
                    "ALERT registration {} is {} at Stripe but no webhook confirmed it: check the webhook endpoint and"
                            + " resend the event, or resolve it by hand (docs/stripe-local.md). Its place stays held.",
                    registration.getId(),
                    atStripe);
        }
    }

    /** Whether Stripe already took the money for this sign-up's session; false when it cannot say. */
    private boolean alreadyPaid(TournamentRegistration registration) {
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
        TournamentRegistration expired = mongoTemplate.findAndModify(
                query,
                support.audited(new Update()
                        .set("status", RegistrationStatus.EXPIRED)
                        .unset("active")
                        .unset("holdExpiresAt")
                        .unset("unpaidSlot")
                        .set("payment.status", PaymentStatus.FAILED)),
                FindAndModifyOptions.options().returnNew(true),
                TournamentRegistration.class);
        if (expired == null) {
            return false;
        }
        tournamentService.releasePlace(expired.getTournamentId());
        support.afterWrite(AuditAction.Update, expired.getId());
        log.info("Sign-up {} expired unpaid; its place is released", expired.getId());
        return true;
    }

    private TournamentRegistration confirm(String registrationId, RegistrationStatus from, String paymentIntentId) {
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
                TournamentRegistration.class);
    }

    private void afterConfirmed(TournamentRegistration confirmed) {
        support.afterWrite(AuditAction.Update, confirmed.getId());
        log.info("Sign-up {} confirmed", confirmed.getId());
        int amount = confirmed.getPayment().getAmountCents();
        support.mail(
                confirmed, (to, tournament, division) -> RegistrationMails.confirmed(to, tournament, division, amount));
    }

    /** The sign-up a Stripe event names, or null when it is unknown or the event is for another session. */
    private TournamentRegistration findForSession(String registrationId, String checkoutSessionId) {
        TournamentRegistration registration =
                registrationId == null ? null : mongoTemplate.findById(registrationId, TournamentRegistration.class);
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

    private TournamentRegistration newRegistration(
            TournamentDto tournament, DivisionDto division, SignUpProfile profile) {
        Instant now = clock.instant();
        return TournamentRegistration.builder()
                .tournamentId(tournament.id())
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
                        .amountCents(tournament.entryFeeCents())
                        .currency(tournament.currency())
                        .status(PaymentStatus.PENDING)
                        .build())
                .createdOnUtc(auditInfoProvider.currentInstant())
                .createdBy(auditInfoProvider.currentUser())
                .build();
    }

    private CheckoutRequest checkoutRequest(
            TournamentDto tournament,
            DivisionDto division,
            SignUpProfile profile,
            TournamentRegistration registration) {
        String id = registration.getId();
        String signUpPage =
                siteUrl + "/tournaments/" + URLEncoder.encode(tournament.slug(), StandardCharsets.UTF_8) + "/signup";
        return new CheckoutRequest(
                id,
                tournament.id(),
                division.id(),
                tournament.name() + " — " + RegistrationMails.label(division),
                registration.getPayment().getAmountCents(),
                registration.getPayment().getCurrency(),
                profile.email(),
                registration.getHoldExpiresAt().plus(RegistrationRules.CHECKOUT_EXPIRY_MARGIN),
                signUpPage + "/complete?registration=" + id,
                signUpPage + "?registration=" + id,
                "checkout-" + id + "-1");
    }

    private boolean hasActive(String competitorId, String tournamentId, String divisionId) {
        return mongoTemplate.exists(
                Query.query(Criteria.where("competitorId")
                        .is(competitorId)
                        .and("tournamentId")
                        .is(tournamentId)
                        .and("divisionId")
                        .is(divisionId)
                        .and("active")
                        .is(true)),
                TournamentRegistration.class);
    }

    private long unpaidCount(String competitorId, String tournamentId) {
        return mongoTemplate.count(
                Query.query(Criteria.where("competitorId")
                        .is(competitorId)
                        .and("tournamentId")
                        .is(tournamentId)
                        .and("status")
                        .is(RegistrationStatus.AWAITING_PAYMENT)),
                TournamentRegistration.class);
    }

    private static ResponseStatusException full() {
        return ApiProblems.conflict(
                ProblemTypes.TOURNAMENT_FULL, "This tournament is full. You have not been charged.");
    }

    private static ResponseStatusException tooManyUnpaid() {
        return ApiProblems.conflict(
                ProblemTypes.TOO_MANY_UNPAID,
                "You already have two unpaid sign-ups in this tournament. Pay for or cancel one first.");
    }

    private static ResponseStatusException alreadyRegistered() {
        return ApiProblems.conflict(
                ProblemTypes.ALREADY_REGISTERED,
                "You already have a sign-up in this division. You have not been charged again.");
    }
}
