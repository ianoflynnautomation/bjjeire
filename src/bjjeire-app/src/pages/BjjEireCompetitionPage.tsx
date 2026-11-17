import type { JSX } from 'react'
import { Link, useParams } from 'react-router'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionPageTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import { BjjEireCompetitionCompetitors } from '@/features/registrations/components/bjjeire-competition-competitors'
import { BjjEireCompetitionDetails } from '@/features/bjjeire-competitions/components/bjjeire-competition-details'
import { BjjEireCompetitionLeaderboard } from '@/features/bjjeire-competitions/components/bjjeire-competition-leaderboard'
import { useBjjEireCompetition } from '@/features/bjjeire-competitions/hooks/useBjjEireCompetition'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buttonVariants } from '@/lib/button-variants'

const { errors, notFound, documentTitle, documentTitleSuffix } =
  uiContent.bjjEireCompetitions

export default function BjjEireCompetitionPage(): JSX.Element {
  const { slug = '' } = useParams()
  const {
    bjjEireCompetition,
    isLoading,
    isNotFound,
    error,
    formattedErrorMessage,
    refetch,
  } = useBjjEireCompetition(slug)
  useDocumentTitle(
    bjjEireCompetition
      ? `${bjjEireCompetition.name} ${documentTitleSuffix}`
      : documentTitle
  )

  let content: JSX.Element
  if (bjjEireCompetition) {
    content = (
      <BjjEireCompetitionDetails bjjEireCompetition={bjjEireCompetition}>
        {bjjEireCompetition.status !== 'CANCELLED' && (
          <BjjEireCompetitionLeaderboard
            bjjEireCompetition={bjjEireCompetition}
          />
        )}
        <BjjEireCompetitionCompetitors
          bjjEireCompetition={bjjEireCompetition}
        />
      </BjjEireCompetitionDetails>
    )
  } else if (isNotFound) {
    content = (
      <div
        role="status"
        className="my-10 rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
        data-testid={BjjEireCompetitionPageTestIds.NOT_FOUND}
      >
        <h1 className="text-lg font-bold text-fg">{notFound.title}</h1>
        <p className="mt-1 text-sm text-fg-subtle">{notFound.message}</p>
        <Link
          to={paths.competitions.getHref()}
          className={buttonVariants({ variant: 'solid', className: 'mt-6' })}
        >
          {notFound.backLink}
        </Link>
      </div>
    )
  } else if (error && !isLoading) {
    content = (
      <ErrorState
        message={formattedErrorMessage}
        onRetry={() => void refetch()}
      />
    )
  } else {
    content = <LoadingState />
  }

  return (
    <PageErrorBoundary errorMessage={errors.loadOneFailed}>
      <PageLayout>{content}</PageLayout>
    </PageErrorBoundary>
  )
}
