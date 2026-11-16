import { uiContent } from '@/config/ui-content'
import { formatEntryFee } from '@/features/tournaments/utils/tournament-format'
import type { CancellationDto, RegistrationDto } from '@/types/registrations'

const { mine } = uiContent.registrations

/** Whether a cancellation now is refunded in full (FR-027): before registration closes. */
export function isRefundable(
  registration: RegistrationDto,
  now: number = Date.now()
): boolean {
  return (
    typeof registration.refundableUntil === 'string' &&
    now < Date.parse(registration.refundableUntil)
  )
}

/** What the competitor is told before confirming (#5022, #5023). */
export function cancelWarning(registration: RegistrationDto): string {
  return isRefundable(registration)
    ? `${mine.refundWarningPrefix} ${formatEntryFee(registration.amountCents, registration.currency ?? 'EUR')} ${mine.refundWarningSuffix}`
    : mine.noRefundWarning
}

/** What the cancellation did about the money (#5027). */
export function cancellationOutcome(outcome: CancellationDto): string {
  if (!outcome.refunded) {
    return mine.cancelledNoRefund
  }
  if (outcome.refundStatus === 'FAILED') {
    return mine.cancelledRefundPending
  }
  return `${mine.cancelledRefundPrefix} ${formatEntryFee(outcome.refundAmountCents, 'EUR')} ${mine.cancelledRefundSuffix}`
}
