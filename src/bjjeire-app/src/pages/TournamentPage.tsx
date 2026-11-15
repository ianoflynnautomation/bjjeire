import type { JSX } from 'react'
import { Link, useParams } from 'react-router'
import PageErrorBoundary from '@/components/error/page-error-boundary'
import PageLayout from '@/components/layout/page-layout'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { TournamentPageTestIds } from '@/constants/tournamentDataTestIds'
import { TournamentDetails } from '@/features/tournaments/components/tournament-details'
import { useTournament } from '@/features/tournaments/hooks/useTournament'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buttonVariants } from '@/lib/button-variants'

const { errors, notFound, documentTitle, documentTitleSuffix } =
  uiContent.tournaments

export default function TournamentPage(): JSX.Element {
  const { slug = '' } = useParams()
  const {
    tournament,
    isLoading,
    isNotFound,
    error,
    formattedErrorMessage,
    refetch,
  } = useTournament(slug)
  useDocumentTitle(
    tournament ? `${tournament.name} ${documentTitleSuffix}` : documentTitle
  )

  let content: JSX.Element
  if (tournament) {
    content = <TournamentDetails tournament={tournament} />
  } else if (isNotFound) {
    content = (
      <div
        role="status"
        className="my-10 rounded-xl bg-surface-solid p-6 text-center shadow-card ring-1 ring-hairline"
        data-testid={TournamentPageTestIds.NOT_FOUND}
      >
        <h1 className="text-lg font-bold text-fg">{notFound.title}</h1>
        <p className="mt-1 text-sm text-fg-subtle">{notFound.message}</p>
        <Link
          to={paths.tournaments.getHref()}
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
