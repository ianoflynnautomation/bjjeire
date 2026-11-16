package com.bjjeire.api.registration;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.competitor.CompetitorIdentity;
import com.bjjeire.api.registration.PaymentGateway.PaymentGatewayException;
import com.bjjeire.api.registration.PaymentGateway.RefundRequest;
import com.bjjeire.api.registration.PaymentGateway.RefundResult;
import com.bjjeire.api.tournament.TournamentDto;
import com.bjjeire.api.tournament.TournamentService;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

/**
 * Mongo and Stripe implementation of {@link CancellationService}. A cancellation is saved first, with its refund
 * {@code PENDING}, and only then asked of Stripe with the key {@code refund-<registrationId>}: a crash in between
 * leaves a pending refund that a retry completes, and Stripe's idempotency makes a repeat return the same refund, never
 * a second one (SC-004). A refund Stripe reported failed is retried under a new key,
 * {@code refund-<registrationId>-<attempt>}, because a reused key only replays Stripe's first answer; Stripe refuses to
 * refund more than was paid.
 */
@Slf4j
@Service
public class CancellationServiceImpl implements CancellationService {
    private final MongoTemplate mongoTemplate;
    private final TournamentService tournamentService;
    private final RegistrationService registrationService;
    private final PaymentGateway paymentGateway;
    private final RegistrationSupport support;
    private final Clock clock;
    private final Counter refundFailures;

    public CancellationServiceImpl(
            MongoTemplate mongoTemplate,
            TournamentService tournamentService,
            RegistrationService registrationService,
            PaymentGateway paymentGateway,
            RegistrationSupport support,
            Clock clock,
            MeterRegistry meterRegistry) {
        this.mongoTemplate = mongoTemplate;
        this.tournamentService = tournamentService;
        this.registrationService = registrationService;
        this.paymentGateway = paymentGateway;
        this.support = support;
        this.clock = clock;
        // The same counter the late-payment refund uses: one alert for every refund that needs the organiser.
        this.refundFailures = Counter.builder(RegistrationServiceImpl.REFUND_FAILURE_METRIC)
                .description("Refunds Stripe refused or could not be reached for; the organiser resolves them by hand")
                .register(meterRegistry);
    }

    @Override
    public CancellationDto cancelOwn(CompetitorIdentity caller, String registrationId) {
        TournamentRegistration registration = support.owned(caller, registrationId);
        TournamentDto tournament =
                tournamentService.getForAdmin(registration.getTournamentId()).orElseThrow(ApiProblems::notFound);
        // FR-027: refunded in full only before registration closes.
        boolean refund = tournament.registrationClosesAt() != null
                && clock.instant().isBefore(tournament.registrationClosesAt());
        return cancel(registration, refund, TournamentRegistration.CANCELLED_BY_COMPETITOR);
    }

    @Override
    public CancellationDto cancelByAdmin(String tournamentId, String registrationId, boolean refund) {
        TournamentRegistration registration = mongoTemplate.findById(registrationId, TournamentRegistration.class);
        if (registration == null || !tournamentId.equals(registration.getTournamentId())) {
            throw ApiProblems.notFound();
        }
        return cancel(registration, refund, TournamentRegistration.CANCELLED_BY_ADMIN);
    }

    @Override
    public TournamentDto cancelTournament(String tournamentId) {
        if (tournamentService.cancel(tournamentId).isEmpty()) {
            throw ApiProblems.notFound();
        }
        // Holds first: a payment confirmed before this still shows as CONFIRMED below; one after it is a late payment,
        // refunded because a cancelled tournament gives no place.
        int holds = registrationService.endHolds(tournamentId);

        java.util.Set<String> thisRun = new java.util.HashSet<>();
        for (TournamentRegistration registration : find(
                Criteria.where("tournamentId").is(tournamentId).and("status").is(RegistrationStatus.CONFIRMED))) {
            cancel(registration, true, TournamentRegistration.CANCELLED_BY_TOURNAMENT);
            thisRun.add(registration.getId());
        }

        // Resume an earlier run that stopped part way: refunds that failed, or were saved but never reached Stripe.
        // A refund that failed just now is left for the organiser's next attempt rather than hammered at once.
        int retried = 0;
        // Every refund of the tournament that failed, whoever cancelled, so the organiser has one place to retry.
        for (TournamentRegistration registration : find(Criteria.where("tournamentId")
                .is(tournamentId)
                .orOperator(
                        Criteria.where("refund.status").is(RefundStatus.FAILED),
                        Criteria.where("refund.status")
                                .is(RefundStatus.PENDING)
                                .and("refund.refundId")
                                .exists(false)
                                .and("cancelledBy")
                                .is(TournamentRegistration.CANCELLED_BY_TOURNAMENT)))) {
            if (thisRun.contains(registration.getId())) {
                continue;
            }
            issueRefund(registration);
            retried++;
        }
        log.info(
                "Tournament {} cancelled: {} sign-up(s) cancelled and refunded, {} refund(s) retried, {} hold(s) ended",
                tournamentId,
                thisRun.size(),
                retried,
                holds);
        return tournamentService.getForAdmin(tournamentId).orElseThrow(ApiProblems::notFound);
    }

    @Override
    public void onRefundUpdated(String registrationId, String refundId, String status, String failureReason) {
        TournamentRegistration registration =
                registrationId == null ? null : mongoTemplate.findById(registrationId, TournamentRegistration.class);
        if (registration == null || registration.getRefund() == null) {
            log.warn("Stripe refund {} names registration {}, which has no refund", refundId, registrationId);
            return;
        }
        String stored = registration.getRefund().getRefundId();
        if (stored != null && !Objects.equals(stored, refundId)) {
            log.warn("Stripe refund {} is not the refund {} of registration {}", refundId, stored, registrationId);
            return;
        }
        Criteria unsettled = Criteria.where("_id")
                .is(registrationId)
                .and("refund.status")
                .in(RefundStatus.PENDING, RefundStatus.FAILED);
        switch (status == null ? "" : status) {
            case "succeeded" -> {
                TournamentRegistration refunded = mongoTemplate.findAndModify(
                        Query.query(unsettled),
                        support.audited(new Update()
                                .set("refund.refundId", refundId)
                                .set("refund.status", RefundStatus.REFUNDED)
                                .set("refund.completedAt", clock.instant())
                                .unset("refund.failureReason")),
                        FindAndModifyOptions.options().returnNew(true),
                        TournamentRegistration.class);
                if (refunded == null) {
                    log.info("Refund of registration {} already recorded as completed", registrationId);
                    return;
                }
                support.afterWrite(AuditAction.Update, registrationId);
                int amount = refunded.getRefund().getAmountCents();
                support.mail(
                        refunded,
                        (to, tournament, division) ->
                                RegistrationMails.refundCompleted(to, tournament, division, amount));
            }
            case "failed", "canceled" -> {
                boolean changed = mongoTemplate
                                .updateFirst(
                                        Query.query(Criteria.where("_id")
                                                .is(registrationId)
                                                .and("refund.status")
                                                .is(RefundStatus.PENDING)),
                                        support.audited(new Update()
                                                .set("refund.refundId", refundId)
                                                .set("refund.status", RefundStatus.FAILED)
                                                .set("refund.failureReason", failureReason)),
                                        TournamentRegistration.class)
                                .getModifiedCount()
                        == 1;
                if (changed) {
                    support.afterWrite(AuditAction.Update, registrationId);
                    alertRefundFailure(registrationId, registration.getRefund().getAmountCents(), failureReason);
                }
            }
            default -> log.debug("Refund {} of registration {} is {}", refundId, registrationId, status);
        }
    }

    // ---- Helpers --------------------------------------------------------------------------------------------------

    private CancellationDto cancel(TournamentRegistration registration, boolean refundWanted, String cancelledBy) {
        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            return CancellationDto.of(registration);
        }
        if (registration.getStatus() != RegistrationStatus.CONFIRMED) {
            throw ApiProblems.conflict(
                    ProblemTypes.CONFLICT,
                    "Only a confirmed sign-up can be cancelled. An unpaid sign-up ends by itself when its hold runs"
                            + " out.");
        }
        // FR-026's "refused once a result names the sign-up" waits for results (slice 5).
        Payment payment = registration.getPayment();
        boolean refund = refundWanted && isRefundable(payment);
        Instant now = clock.instant();
        Update update = support.audited(new Update()
                .set("status", RegistrationStatus.CANCELLED)
                .unset("active")
                .set("cancelledAt", now)
                .set("cancelledBy", cancelledBy));
        if (refund) {
            update.set(
                    "refund",
                    Refund.builder()
                            .amountCents(payment.getAmountCents())
                            .status(RefundStatus.PENDING)
                            .requestedAt(now)
                            .build());
        }
        TournamentRegistration cancelled = mongoTemplate.findAndModify(
                Query.query(Criteria.where("_id")
                        .is(registration.getId())
                        .and("status")
                        .is(RegistrationStatus.CONFIRMED)),
                update,
                FindAndModifyOptions.options().returnNew(true),
                TournamentRegistration.class);
        if (cancelled == null) {
            return cancelledMeanwhile(registration.getId());
        }
        tournamentService.releasePlace(cancelled.getTournamentId());
        support.afterWrite(AuditAction.Update, cancelled.getId());
        log.info(
                "Sign-up {} cancelled by {}, {}",
                cancelled.getId(),
                cancelledBy,
                refund ? "refund requested" : "no refund");
        if (refund) {
            cancelled = issueRefund(cancelled);
        }

        mailCancellation(cancelled, cancelledBy);
        return CancellationDto.of(cancelled);
    }

    /** Money was taken that is due back. Without a recorded Stripe payment the refund is recorded as failed. */
    private static boolean isRefundable(Payment payment) {
        return payment != null && payment.getAmountCents() > 0;
    }

    /** Another request cancelled it a moment ago: report what that one did. */
    private CancellationDto cancelledMeanwhile(String registrationId) {
        TournamentRegistration current = mongoTemplate.findById(registrationId, TournamentRegistration.class);
        if (current != null && current.getStatus() == RegistrationStatus.CANCELLED) {
            return CancellationDto.of(current);
        }
        throw ApiProblems.conflict(
                ProblemTypes.CONFLICT, "The sign-up was changed meanwhile. Reload it and try again.");
    }

    private void mailCancellation(TournamentRegistration done, String cancelledBy) {
        if (TournamentRegistration.CANCELLED_BY_TOURNAMENT.equals(cancelledBy)) {
            int amount = done.getRefund() == null ? 0 : done.getRefund().getAmountCents();
            support.mail(
                    done,
                    (to, tournament, division) ->
                            RegistrationMails.tournamentCancelled(to, tournament, division, amount));
        } else {
            support.mail(
                    done,
                    (to, tournament, division) ->
                            RegistrationMails.cancelled(to, tournament, division, done.getRefund()));
        }
    }

    /** Asks Stripe for the saved refund and records the answer. Never throws for a Stripe failure. */
    private TournamentRegistration issueRefund(TournamentRegistration registration) {
        Refund refund = registration.getRefund();
        String id = registration.getId();
        Criteria unsettled =
                Criteria.where("_id").is(id).and("refund.status").in(RefundStatus.PENDING, RefundStatus.FAILED);
        // A refund Stripe failed is asked for again under a new key; one that never reached Stripe reuses its key.
        // A failed refund reached Stripe at least once (a late-payment refund, or one whose save was lost, may still
        // read 0), so its retry always takes a key Stripe has not seen.
        int asked = Math.max(1, refund.getAttempts());
        int attempt = refund.getStatus() == RefundStatus.FAILED ? asked + 1 : asked;
        String key = attempt == 1 ? "refund-" + id : "refund-" + id + "-" + attempt;
        String paymentIntentId = registration.getPayment().getPaymentIntentId();
        if (paymentIntentId == null) {
            recordRefundFailure(
                    id, attempt, refund.getAmountCents(), "No Stripe payment is recorded for this sign-up.");
            return mongoTemplate.findById(id, TournamentRegistration.class);
        }
        try {
            RefundResult result =
                    paymentGateway.refund(new RefundRequest(id, paymentIntentId, refund.getAmountCents(), key));
            Update update = support.audited(new Update()
                    .set("refund.attempts", attempt)
                    .set("refund.refundId", result.refundId())
                    .set("refund.status", result.succeeded() ? RefundStatus.REFUNDED : RefundStatus.PENDING)
                    .unset("refund.failureReason"));
            if (result.succeeded()) {
                update.set("refund.completedAt", clock.instant());
            }
            // Guarded: a refund webhook that already completed it is not set back to pending.
            mongoTemplate.updateFirst(Query.query(unsettled), update, TournamentRegistration.class);
        } catch (PaymentGatewayException failed) {
            recordRefundFailure(id, attempt, refund.getAmountCents(), failed.getMessage());
            return mongoTemplate.findById(id, TournamentRegistration.class);
        }
        support.afterWrite(AuditAction.Update, id);
        return mongoTemplate.findById(id, TournamentRegistration.class);
    }

    private void recordRefundFailure(String id, int attempt, int amountCents, String reason) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id")
                        .is(id)
                        .and("refund.status")
                        .in(RefundStatus.PENDING, RefundStatus.FAILED)),
                support.audited(new Update()
                        .set("refund.attempts", attempt)
                        .set("refund.status", RefundStatus.FAILED)
                        .set("refund.failureReason", reason)),
                TournamentRegistration.class);
        support.afterWrite(AuditAction.Update, id);
        alertRefundFailure(id, amountCents, reason);
    }

    private void alertRefundFailure(String registrationId, int amountCents, String reason) {
        refundFailures.increment();
        log.error(
                "ALERT refund of registration {} ({} cents) failed and must be resolved by hand: {}",
                registrationId,
                amountCents,
                reason);
    }

    private List<TournamentRegistration> find(Criteria criteria) {
        return mongoTemplate.find(Query.query(criteria), TournamentRegistration.class);
    }
}
