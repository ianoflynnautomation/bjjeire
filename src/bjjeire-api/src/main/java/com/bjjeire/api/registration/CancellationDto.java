package com.bjjeire.api.registration;

/**
 * What a cancellation did about the money (#5022, #5023).
 *
 * @param refunded true when a full refund was asked of Stripe
 * @param refundAmountCents the amount refunded, 0 when none
 * @param refundStatus null when no refund; {@code PENDING} until Stripe reports it; {@code FAILED} when Stripe refused
 *     it, shown to the competitor as "refund pending" while the organiser resolves it
 */
public record CancellationDto(boolean refunded, int refundAmountCents, RefundStatus refundStatus) {
    static CancellationDto of(BjjEireCompetitionRegistration registration) {
        Refund refund = registration.getRefund();
        return refund == null
                ? new CancellationDto(false, 0, null)
                : new CancellationDto(true, refund.getAmountCents(), refund.getStatus());
    }
}
