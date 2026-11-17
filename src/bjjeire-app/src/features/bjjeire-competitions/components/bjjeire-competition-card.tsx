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
  BjjEireCompetitionCardTestIds,
  BjjEireCompetitionsFeaturedTestIds,
} from '@/constants/bjjEireCompetitionDataTestIds'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/cn'
import type { BjjEireCompetitionSummaryDto } from '@/types/bjjeire-competitions'
import { formatDate } from '@/utils/date-utils'
import { readString } from '@/utils/untrusted'
import { formatEntryFee } from '../utils/bjjeire-competition-format'
import {
  BJJEIRE_COMPETITION_IMAGE,
  BJJEIRE_COMPETITION_IMAGE_HEIGHT,
  BJJEIRE_COMPETITION_IMAGE_WIDTH,
} from '../utils/card-image'
import { RegistrationStateBadge } from './registration-state-badge'

const { card } = uiContent.bjjEireCompetitions

interface BjjEireCompetitionCardProps {
  bjjEireCompetition: BjjEireCompetitionSummaryDto
  dataTestId?: string
}

export const BjjEireCompetitionCard = function BjjEireCompetitionCard({
  bjjEireCompetition,
  dataTestId = BjjEireCompetitionsFeaturedTestIds.FEATURED_CARD,
}: BjjEireCompetitionCardProps): JSX.Element {
  const headingId = `bjjeire-competition-card-heading-${bjjEireCompetition.id}`
  const venueName = readString(bjjEireCompetition.venue?.venue)
  const divisionsLabel =
    bjjEireCompetition.divisionCount === 1
      ? card.divisionsSingular
      : card.divisionsPlural

  return (
    <Card
      className="relative isolate focus-within:ring-2 focus-within:ring-primary-500/60"
      data-testid={dataTestId}
      aria-labelledby={headingId}
    >
      <header className="h-28 w-full overflow-hidden bg-ink-50 sm:h-36 md:h-40">
        {/* The same logo on every card, and the heading names the competition. */}
        <img
          src={BJJEIRE_COMPETITION_IMAGE}
          alt=""
          width={BJJEIRE_COMPETITION_IMAGE_WIDTH}
          height={BJJEIRE_COMPETITION_IMAGE_HEIGHT}
          className="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
          data-testid={BjjEireCompetitionCardTestIds.IMAGE}
        />
      </header>

      <CardContent>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h3
            id={headingId}
            className="text-base font-bold leading-snug text-fg"
            data-testid={BjjEireCompetitionCardTestIds.NAME}
          >
            {bjjEireCompetition.name}
          </h3>
          <RegistrationStateBadge
            status={bjjEireCompetition.status}
            registrationState={bjjEireCompetition.registrationState}
            dataTestId={BjjEireCompetitionCardTestIds.STATE}
          />
        </div>

        <dl className="mb-4 space-y-1.5 text-sm text-fg-subtle">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{card.dateLabel}</dt>
            <CalendarDaysIcon
              className="h-4 w-4 shrink-0 text-primary-500"
              aria-hidden="true"
            />
            <dd data-testid={BjjEireCompetitionCardTestIds.DATE}>
              {formatDate(bjjEireCompetition.date)}
            </dd>
          </div>
          {venueName && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">{card.venueLabel}</dt>
              <MapPinIcon
                className="h-4 w-4 shrink-0 text-primary-500"
                aria-hidden="true"
              />
              <dd data-testid={BjjEireCompetitionCardTestIds.VENUE}>
                {venueName}
              </dd>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{card.feeLabel}</dt>
            <TicketIcon
              className="h-4 w-4 shrink-0 text-primary-500"
              aria-hidden="true"
            />
            <dd data-testid={BjjEireCompetitionCardTestIds.FEE}>
              {formatEntryFee(
                bjjEireCompetition.entryFeeCents,
                bjjEireCompetition.currency
              )}
            </dd>
          </div>
        </dl>

        <p
          className="mb-4 text-sm text-fg-muted"
          data-testid={BjjEireCompetitionCardTestIds.DIVISION_COUNT}
        >
          {`${bjjEireCompetition.divisionCount} ${divisionsLabel}`}
        </p>

        <Link
          to={paths.bjjEireCompetition.getHref(bjjEireCompetition.slug)}
          aria-label={`${card.viewButton}: ${bjjEireCompetition.name}`}
          className={cn(buttonVariants({ variant: 'solid' }), 'mt-auto')}
          data-testid={BjjEireCompetitionCardTestIds.LINK}
        >
          {card.viewButton}
        </Link>
      </CardContent>
    </Card>
  )
}
