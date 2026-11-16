import type { JSX } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import PageLayout from '@/components/layout/page-layout'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { SignUpPageTestIds } from '@/constants/registrationDataTestIds'
import { CompetitorSignInGate } from '@/features/competitor/components/competitor-sign-in-gate'
import { createRegistration } from '@/features/registrations/api/registration-api'
import { AbandonedCheckout } from '@/features/registrations/components/abandoned-checkout'
import { SignUpForm } from '@/features/registrations/components/sign-up-form'
import { useCheckoutRedirect } from '@/features/registrations/hooks/useCheckoutRedirect'
import { useEligibleDivisions } from '@/features/registrations/hooks/useEligibleDivisions'
import { registrationProblemType } from '@/features/registrations/utils/registration-problem'
import { useBjjEireCompetition } from '@/features/bjjeire-competitions/hooks/useBjjEireCompetition'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { BjjEireCompetitionDto } from '@/types/bjjeire-competitions'

const { signUp, problems } = uiContent.registrations

const noticeClass =
  'rounded-xl bg-surface-solid p-5 text-sm text-fg ring-1 ring-hairline'

interface ChooseDivisionProps {
  bjjEireCompetition: BjjEireCompetitionDto
}

const ChooseDivision = function ChooseDivision({
  bjjEireCompetition,
}: ChooseDivisionProps): JSX.Element {
  const open = bjjEireCompetition.registrationState === 'OPEN'
  const eligible = useEligibleDivisions(bjjEireCompetition.id, open)
  const start = useCheckoutRedirect(createRegistration)

  if (!open) {
    return (
      <p className={noticeClass} data-testid={SignUpPageTestIds.NOT_OPEN}>
        {bjjEireCompetition.registrationState === 'FULL'
          ? problems['urn:bjjeire:competition-full']
          : signUp.notOpen}
      </p>
    )
  }
  if (eligible.isPending) {
    return <LoadingState />
  }
  if (eligible.isError) {
    const type = registrationProblemType(eligible.error)
    if (type === 'urn:bjjeire:profile-incomplete') {
      return (
        <div
          className={noticeClass}
          data-testid={SignUpPageTestIds.PROFILE_INCOMPLETE}
        >
          <p>{signUp.profileIncomplete}</p>
          <Link
            to={paths.accountProfile.getHref()}
            className="mt-3 inline-block font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
            data-testid={SignUpPageTestIds.PROFILE_LINK}
          >
            {signUp.profileLink}
          </Link>
        </div>
      )
    }
    if (type === 'urn:bjjeire:under-18') {
      return (
        <p className={noticeClass} data-testid={SignUpPageTestIds.UNDER_18}>
          {signUp.underEighteen}
        </p>
      )
    }
    if (type === 'urn:bjjeire:registration-not-open') {
      return (
        <p className={noticeClass} data-testid={SignUpPageTestIds.NOT_OPEN}>
          {signUp.notOpen}
        </p>
      )
    }
    return (
      <ErrorState
        message={signUp.loadFailed}
        onRetry={() => void eligible.refetch()}
      />
    )
  }
  if (eligible.data.length === 0) {
    return (
      <p className={noticeClass} data-testid={SignUpPageTestIds.NO_DIVISIONS}>
        {signUp.noDivisions}
      </p>
    )
  }
  return (
    <SignUpForm
      bjjEireCompetition={bjjEireCompetition}
      divisions={eligible.data}
      isSubmitting={start.isPending}
      error={start.error}
      onSubmit={divisionId =>
        start.start({
          competitionId: bjjEireCompetition.id,
          divisionId,
          acceptPublicListing: true,
          acceptTerms: true,
        })
      }
    />
  )
}

/** `/competitions/:slug/signup`: choose a division, consent, and go to Checkout (User Story 3). */
export default function SignUpPage(): JSX.Element {
  useDocumentTitle(signUp.documentTitle)
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const returnedRegistration = searchParams.get('registration')
  const { bjjEireCompetition, isLoading, formattedErrorMessage, refetch } =
    useBjjEireCompetition(slug)

  let content: JSX.Element
  if (bjjEireCompetition) {
    content = (
      <div className="space-y-6">
        <Link
          to={paths.bjjEireCompetition.getHref(bjjEireCompetition.slug)}
          className="inline-block text-sm font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
          data-testid={SignUpPageTestIds.BACK_LINK}
        >
          {`← ${signUp.backLink}`}
        </Link>
        <h1
          className="display-expanded text-3xl font-bold text-fg"
          data-testid={SignUpPageTestIds.HEADING}
        >
          {`${signUp.headingPrefix} ${bjjEireCompetition.name}`}
        </h1>
        <CompetitorSignInGate>
          <div className="space-y-6">
            {returnedRegistration && (
              <AbandonedCheckout registrationId={returnedRegistration} />
            )}
            <ChooseDivision bjjEireCompetition={bjjEireCompetition} />
          </div>
        </CompetitorSignInGate>
      </div>
    )
  } else if (isLoading) {
    content = <LoadingState />
  } else {
    content = (
      <ErrorState
        message={formattedErrorMessage}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl" data-testid={SignUpPageTestIds.ROOT}>
        {content}
      </div>
    </PageLayout>
  )
}
