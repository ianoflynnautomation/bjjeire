import type { CSSProperties, JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { TournamentsPageTestIds } from '@/constants/tournamentDataTestIds'
import type { TournamentSummaryDto } from '@/types/tournaments'
import { TournamentCard } from './tournament-card'

const { list } = uiContent.tournaments

interface TournamentsListProps {
  tournaments: TournamentSummaryDto[]
}

export const TournamentsList = function TournamentsList({
  tournaments,
}: TournamentsListProps): JSX.Element {
  return (
    <ul
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-label={list.ariaLabel}
      data-testid={TournamentsPageTestIds.LIST}
    >
      {tournaments.map((tournament, index) => (
        <li
          key={tournament.id}
          className="animate-rise"
          style={{ '--i': index } as CSSProperties}
        >
          <TournamentCard tournament={tournament} />
        </li>
      ))}
    </ul>
  )
}
