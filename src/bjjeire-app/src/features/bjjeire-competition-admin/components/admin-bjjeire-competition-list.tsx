import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge/badge'
import ErrorState from '@/components/ui/state/error-state'
import LoadingState from '@/components/ui/state/loading-state'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionAdminTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import { formatDate } from '@/utils/date-utils'
import { ADMIN_BJJEIRE_COMPETITIONS_KEY } from '../api/query-keys'
import { getAdminBjjEireCompetitions } from '../api/bjjeire-competition-admin-api'

const { list } = uiContent.bjjEireCompetitionAdmin
const { statuses } = uiContent.bjjEireCompetitions

const STATUS_COLOURS = {
  DRAFT: 'amber',
  PUBLISHED: 'emerald',
  CANCELLED: 'red',
  FINISHED: 'slate',
} as const

export const AdminBjjEireCompetitionList =
  function AdminBjjEireCompetitionList(): JSX.Element {
    const { data, isLoading, error, refetch } = useQuery({
      queryKey: ADMIN_BJJEIRE_COMPETITIONS_KEY,
      queryFn: getAdminBjjEireCompetitions,
    })

    if (isLoading) {
      return <LoadingState />
    }
    if (error) {
      return (
        <ErrorState message={list.loadFailed} onRetry={() => void refetch()} />
      )
    }
    const bjjEireCompetitions = data?.data ?? []
    if (bjjEireCompetitions.length === 0) {
      return <p className="text-sm text-fg-subtle">{list.empty}</p>
    }
    return (
      <ul
        aria-label={list.ariaLabel}
        className="divide-y divide-hairline overflow-hidden rounded-xl bg-surface-solid ring-1 ring-hairline"
        data-testid={BjjEireCompetitionAdminTestIds.LIST}
      >
        {bjjEireCompetitions.map(bjjEireCompetition => (
          <li
            key={bjjEireCompetition.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            data-testid={BjjEireCompetitionAdminTestIds.LIST_ITEM}
          >
            <div>
              <p className="font-semibold text-fg">{bjjEireCompetition.name}</p>
              <p className="text-sm text-fg-subtle">
                {formatDate(bjjEireCompetition.date)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                text={statuses[bjjEireCompetition.status]}
                colorScheme={STATUS_COLOURS[bjjEireCompetition.status]}
                data-testid={BjjEireCompetitionAdminTestIds.LIST_ITEM_STATUS}
              />
              <Link
                to={paths.adminBjjEireCompetition.getHref(
                  bjjEireCompetition.id
                )}
                aria-label={`${list.editLink}: ${bjjEireCompetition.name}`}
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
