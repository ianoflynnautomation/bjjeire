import type { JSX } from 'react'
import { Link } from 'react-router'
import PageLayout from '@/components/layout/page-layout'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { MySignUpsTestIds } from '@/constants/registrationDataTestIds'
import { CompetitorSignInGate } from '@/features/competitor/components/competitor-sign-in-gate'
import { MyRegistrationsTable } from '@/features/registrations/components/my-registrations-table'
import { useOwnRegistrations } from '@/features/registrations/hooks/useOwnRegistrations'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const { mine } = uiContent.registrations

const MySignUps = function MySignUps(): JSX.Element {
  const own = useOwnRegistrations()
  if (own.isPending) {
    return <LoadingState />
  }
  if (own.isError) {
    return (
      <ErrorState
        message={mine.loadFailed}
        onRetry={() => void own.refetch()}
      />
    )
  }
  if (own.data.length === 0) {
    return (
      <div
        className="rounded-xl bg-surface-solid p-6 text-sm text-fg ring-1 ring-hairline"
        data-testid={MySignUpsTestIds.EMPTY}
      >
        <p>{mine.empty}</p>
        <Link
          to={paths.competitions.getHref()}
          className="mt-3 inline-block font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
        >
          {mine.browseLink}
        </Link>
      </div>
    )
  }
  return <MyRegistrationsTable registrations={own.data} />
}

/** `/account/signups`: the competitor's own sign-ups (#5021). */
export default function MySignUpsPage(): JSX.Element {
  useDocumentTitle(mine.documentTitle)
  return (
    <PageLayout>
      <div className="space-y-6" data-testid={MySignUpsTestIds.ROOT}>
        <header className="space-y-2">
          <h1 className="display-expanded text-3xl font-bold text-fg">
            {mine.heading}
          </h1>
          <p className="text-sm text-fg-subtle">{mine.intro}</p>
        </header>
        <CompetitorSignInGate>
          <MySignUps />
        </CompetitorSignInGate>
      </div>
    </PageLayout>
  )
}
