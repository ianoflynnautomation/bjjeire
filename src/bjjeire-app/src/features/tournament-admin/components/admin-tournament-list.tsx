import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge/badge'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { TournamentAdminTestIds } from '@/constants/tournamentDataTestIds'
import { formatDate } from '@/utils/date-utils'
import { ADMIN_TOURNAMENTS_KEY } from '../api/query-keys'
import { getAdminTournaments } from '../api/tournament-admin-api'

const { list } = uiContent.tournamentAdmin
const { statuses } = uiContent.tournaments

const STATUS_COLOURS = {
  DRAFT: 'amber',
  PUBLISHED: 'emerald',
  CANCELLED: 'red',
  FINISHED: 'slate',
} as const

export const AdminTournamentList = function AdminTournamentList(): JSX.Element {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ADMIN_TOURNAMENTS_KEY,
    queryFn: getAdminTournaments,
  })

  if (isLoading) {
    return <LoadingState />
  }
  if (error) {
    return (
      <ErrorState message={list.loadFailed} onRetry={() => void refetch()} />
    )
  }
  const tournaments = data?.data ?? []
  if (tournaments.length === 0) {
    return <p className="text-sm text-fg-subtle">{list.empty}</p>
  }
  return (
    <ul
      aria-label={list.ariaLabel}
      className="divide-y divide-hairline overflow-hidden rounded-xl bg-surface-solid ring-1 ring-hairline"
      data-testid={TournamentAdminTestIds.LIST}
    >
      {tournaments.map(tournament => (
        <li
          key={tournament.id}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          data-testid={TournamentAdminTestIds.LIST_ITEM}
        >
          <div>
            <p className="font-semibold text-fg">{tournament.name}</p>
            <p className="text-sm text-fg-subtle">
              {formatDate(tournament.date)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              text={statuses[tournament.status]}
              colorScheme={STATUS_COLOURS[tournament.status]}
              data-testid={TournamentAdminTestIds.LIST_ITEM_STATUS}
            />
            <Link
              to={paths.adminTournament.getHref(tournament.id)}
              aria-label={`${list.editLink}: ${tournament.name}`}
              className="rounded-sm text-sm font-semibold text-primary-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:text-primary-300"
            >
              {list.editLink}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}
