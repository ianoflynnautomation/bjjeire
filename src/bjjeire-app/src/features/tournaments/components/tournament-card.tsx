import type { JSX } from 'react'
import { Link } from 'react-router'
import {
  CalendarDaysIcon,
  MapPinIcon,
  TicketIcon,
} from '@heroicons/react/20/solid'
import { Card, CardContent } from '@/components/ui/card/card'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import {
  TournamentCardTestIds,
  TournamentsPageTestIds,
} from '@/constants/tournamentDataTestIds'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/cn'
import type { TournamentSummaryDto } from '@/types/tournaments'
import { formatDate } from '@/utils/date-utils'
import { readString } from '@/utils/untrusted'
import { formatEntryFee } from '../utils/tournament-format'
import { RegistrationStateBadge } from './registration-state-badge'

const { card } = uiContent.tournaments

interface TournamentCardProps {
  tournament: TournamentSummaryDto
  dataTestId?: string
}

export const TournamentCard = function TournamentCard({
  tournament,
  dataTestId = TournamentsPageTestIds.LIST_ITEM,
}: TournamentCardProps): JSX.Element {
  const headingId = `tournament-card-heading-${tournament.id}`
  const venueName = readString(tournament.venue?.venue)
  const divisionsLabel =
    tournament.divisionCount === 1
      ? card.divisionsSingular
      : card.divisionsPlural

  return (
    <Card
      className="relative isolate focus-within:ring-2 focus-within:ring-primary-500/60"
      data-testid={dataTestId}
      aria-labelledby={headingId}
    >
      <CardContent>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h3
            id={headingId}
            className="text-base font-bold leading-snug text-fg"
            data-testid={TournamentCardTestIds.NAME}
          >
            {tournament.name}
          </h3>
          <RegistrationStateBadge
            status={tournament.status}
            registrationState={tournament.registrationState}
            dataTestId={TournamentCardTestIds.STATE}
          />
        </div>

        <dl className="mb-4 space-y-1.5 text-sm text-fg-subtle">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{card.dateLabel}</dt>
            <CalendarDaysIcon
              className="h-4 w-4 shrink-0 text-primary-500"
              aria-hidden="true"
            />
            <dd data-testid={TournamentCardTestIds.DATE}>
              {formatDate(tournament.date)}
            </dd>
          </div>
          {venueName && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">{card.venueLabel}</dt>
              <MapPinIcon
                className="h-4 w-4 shrink-0 text-primary-500"
                aria-hidden="true"
              />
              <dd data-testid={TournamentCardTestIds.VENUE}>{venueName}</dd>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{card.feeLabel}</dt>
            <TicketIcon
              className="h-4 w-4 shrink-0 text-primary-500"
              aria-hidden="true"
            />
            <dd data-testid={TournamentCardTestIds.FEE}>
              {formatEntryFee(tournament.entryFeeCents, tournament.currency)}
            </dd>
          </div>
        </dl>

        <p
          className="mb-4 text-sm text-fg-muted"
          data-testid={TournamentCardTestIds.DIVISION_COUNT}
        >
          {`${tournament.divisionCount} ${divisionsLabel}`}
        </p>

        <Link
          to={paths.tournament.getHref(tournament.slug)}
          aria-label={`${card.viewButton}: ${tournament.name}`}
          className={cn(buttonVariants({ variant: 'solid' }), 'mt-auto')}
          data-testid={TournamentCardTestIds.LINK}
        >
          {card.viewButton}
        </Link>
      </CardContent>
    </Card>
  )
}
