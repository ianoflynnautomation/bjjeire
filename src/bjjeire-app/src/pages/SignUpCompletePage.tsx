import type { JSX } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import PageLayout from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button/button'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { SignUpCompleteTestIds } from '@/constants/registrationDataTestIds'
import { CompetitorSignInGate } from '@/features/competitor/components/competitor-sign-in-gate'
import { resumeCheckout } from '@/features/registrations/api/registration-api'
import { useCheckoutRedirect } from '@/features/registrations/hooks/useCheckoutRedirect'
import { useAwaitedRegistration } from '@/features/registrations/hooks/useOwnRegistrations'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buttonVariants } from '@/lib/button-variants'

const { complete } = uiContent.registrations

const linkClass =
  'font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300'

interface OutcomeProps {
  slug: string
  registrationId: string
}

const Outcome = function Outcome({
  slug,
  registrationId,
}: OutcomeProps): JSX.Element {
  const { query, registration } = useAwaitedRegistration(registrationId)
  const resume = useCheckoutRedirect(resumeCheckout)

  if (query.isPending) {
    return (
      <div data-testid={SignUpCompleteTestIds.CHECKING}>
        <LoadingState message={complete.checking} />
      </div>
    )
  }
  if (query.isError) {
    return (
      <ErrorState
        message={complete.unknown}
        onRetry={() => void query.refetch()}
      />
    )
  }
  if (!registration) {
    return (
      <p role="status" data-testid={SignUpCompleteTestIds.UNKNOWN}>
        {complete.unknown}
      </p>
    )
  }
  if (registration.status === 'CONFIRMED') {
    return (
      <div role="status" data-testid={SignUpCompleteTestIds.CONFIRMED}>
        <h1 className="display-expanded text-3xl font-bold text-fg">
          {complete.confirmedHeading}
        </h1>
        <p className="mt-3 text-sm text-fg-muted">
          {complete.confirmedMessage}
        </p>
      </div>
    )
  }
  if (registration.status === 'AWAITING_PAYMENT') {
    return (
      <div role="status" data-testid={SignUpCompleteTestIds.PENDING}>
        <h1 className="display-expanded text-3xl font-bold text-fg">
          {complete.pendingHeading}
        </h1>
        <p className="mt-3 text-sm text-fg-muted">{complete.pendingMessage}</p>
        {resume.received && (
          <p role="status" className="mt-3 text-sm text-fg">
            {resume.received}
          </p>
        )}
        {resume.error && (
          <p
            role="alert"
            className="mt-3 text-sm text-danger-600 dark:text-danger-400"
          >
            {resume.error}
          </p>
        )}
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => resume.start(registrationId)}
          disabled={resume.isPending}
          data-testid={SignUpCompleteTestIds.RESUME}
        >
          {uiContent.registrations.signUp.resume}
        </Button>
      </div>
    )
  }
  if (registration.paymentStatus === 'PAID' && registration.refundStatus) {
    return (
      <div role="status" data-testid={SignUpCompleteTestIds.REFUNDED}>
        <h1 className="display-expanded text-3xl font-bold text-fg">
          {complete.refundedHeading}
        </h1>
        <p className="mt-3 text-sm text-fg-muted">
          {registration.refundStatus === 'REFUNDED'
            ? complete.refundedMessage
            : complete.refundPendingMessage}
        </p>
      </div>
    )
  }
  return (
    <div role="status" data-testid={SignUpCompleteTestIds.FAILED}>
      <h1 className="display-expanded text-3xl font-bold text-fg">
        {complete.failedHeading}
      </h1>
      <p className="mt-3 text-sm text-fg-muted">{complete.failedMessage}</p>
      <Link
        to={paths.bjjEireCompetitionSignUp.getHref(slug)}
        className={buttonVariants({ className: 'mt-4 inline-block' })}
        data-testid={SignUpCompleteTestIds.TRY_AGAIN}
      >
        {complete.tryAgain}
      </Link>
    </div>
  )
}

/**
 * `/competitions/:slug/signup/complete`: where Stripe Checkout returns the
 * competitor. It only reads: confirmation comes from the webhook (FR-018).
 */
export default function SignUpCompletePage(): JSX.Element {
  useDocumentTitle(complete.documentTitle)
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const registrationId = searchParams.get('registration') ?? ''

  return (
    <PageLayout>
      <div
        className="mx-auto max-w-2xl space-y-6 rounded-xl bg-surface-solid p-6 ring-1 ring-hairline"
        data-testid={SignUpCompleteTestIds.ROOT}
      >
        <CompetitorSignInGate>
          <Outcome slug={slug} registrationId={registrationId} />
        </CompetitorSignInGate>
        <nav className="flex flex-wrap gap-4 text-sm">
          <Link
            to={paths.bjjEireCompetition.getHref(slug)}
            className={linkClass}
          >
            {complete.bjjEireCompetitionLink}
          </Link>
          <Link to={paths.accountSignUps.getHref()} className={linkClass}>
            {complete.mySignUpsLink}
          </Link>
        </nav>
      </div>
    </PageLayout>
  )
}
