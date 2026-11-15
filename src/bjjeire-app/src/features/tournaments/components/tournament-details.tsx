import type { JSX } from 'react'
import { Link } from 'react-router'
import { TricolorEdge } from '@/components/ui/decoration/tricolor-edge'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { TournamentPageTestIds } from '@/constants/tournamentDataTestIds'
import type { TournamentDto } from '@/types/tournaments'
import { formatDate } from '@/utils/date-utils'
import { formatDublinDateTime } from '@/utils/dublin-time'
import { readString } from '@/utils/untrusted'
import { formatEntryFee, registrationMessage } from '../utils/tournament-format'
import { DivisionGroups } from './division-groups'
import { RegistrationStateBadge } from './registration-state-badge'

const { details, registration } = uiContent.tournaments

interface TournamentDetailsProps {
  tournament: TournamentDto
}

const factLabelClass =
  'text-xs font-semibold uppercase tracking-wider text-fg-subtle'
const factValueClass = 'mt-1 text-sm text-fg'

export const TournamentDetails = function TournamentDetails({
  tournament,
}: TournamentDetailsProps): JSX.Element {
  const venueName = readString(tournament.venue?.venue)
  const venueAddress = readString(tournament.venue?.address)
  const hasLimit =
    tournament.competitorLimit !== null &&
    tournament.competitorLimit !== undefined

  return (
    <article data-testid={TournamentPageTestIds.ROOT}>
      <Link
        to={paths.tournaments.getHref()}
        className="mb-4 inline-block rounded-sm text-sm font-semibold text-primary-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:text-primary-300"
        data-testid={TournamentPageTestIds.BACK_LINK}
      >
        {`← ${details.backLink}`}
      </Link>

      <header className="relative mb-8 overflow-hidden rounded-xl bg-surface-solid px-5 py-6 ring-1 ring-hairline sm:px-7">
        <TricolorEdge />
        <div className="relative">
          <h1
            className="display-expanded text-3xl font-bold text-fg sm:text-4xl"
            data-testid={TournamentPageTestIds.NAME}
          >
            {tournament.name}
          </h1>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className={factLabelClass}>{details.dateLabel}</dt>
              <dd
                className={factValueClass}
                data-testid={TournamentPageTestIds.DATE}
              >
                {formatDate(tournament.date)}
              </dd>
            </div>
            <div>
              <dt className={factLabelClass}>{details.venueLabel}</dt>
              <dd
                className={factValueClass}
                data-testid={TournamentPageTestIds.VENUE}
              >
                <span className="block font-semibold">{venueName}</span>
                {venueAddress && (
                  <span className="block text-fg-muted">{venueAddress}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className={factLabelClass}>{details.feeLabel}</dt>
              <dd
                className={factValueClass}
                data-testid={TournamentPageTestIds.FEE}
              >
                <span className="font-semibold">
                  {formatEntryFee(
                    tournament.entryFeeCents,
                    tournament.currency
                  )}
                </span>{' '}
                <span className="text-fg-muted">{details.feeNote}</span>
              </dd>
            </div>
            <div>
              <dt className={factLabelClass}>{details.windowLabel}</dt>
              <dd
                className={factValueClass}
                data-testid={TournamentPageTestIds.WINDOW}
              >
                {`${formatDublinDateTime(tournament.registrationOpensAt)} ${details.windowSeparator} ${formatDublinDateTime(tournament.registrationClosesAt)}`}{' '}
                <span className="text-fg-muted">{`(${details.timeZoneNote})`}</span>
              </dd>
            </div>
            {hasLimit && (
              <div>
                <dt className={factLabelClass}>{details.placesLabel}</dt>
                <dd
                  className={factValueClass}
                  data-testid={TournamentPageTestIds.PLACES}
                >
                  {`${tournament.placesTaken} ${details.placesSeparator} ${tournament.competitorLimit} ${details.placesTakenSuffix}`}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      <section
        aria-labelledby="tournament-registration-heading"
        className="mb-8 rounded-xl bg-surface-solid p-5 ring-1 ring-hairline sm:px-7"
        data-testid={TournamentPageTestIds.REGISTRATION_STATUS}
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="tournament-registration-heading"
            className="text-lg font-bold text-fg"
          >
            {registration.heading}
          </h2>
          <RegistrationStateBadge
            status={tournament.status}
            registrationState={tournament.registrationState}
          />
        </div>
        <p
          className="mt-2 text-sm text-fg-muted"
          data-testid={TournamentPageTestIds.REGISTRATION_MESSAGE}
        >
          {registrationMessage(tournament)}
        </p>
      </section>

      {tournament.description && (
        <section aria-labelledby="tournament-about-heading" className="mb-8">
          <h2
            id="tournament-about-heading"
            className="mb-3 text-lg font-bold text-fg"
          >
            {details.aboutHeading}
          </h2>
          <p
            className="whitespace-pre-line text-sm leading-relaxed text-fg-muted"
            data-testid={TournamentPageTestIds.DESCRIPTION}
          >
            {tournament.description}
          </p>
        </section>
      )}

      <section aria-labelledby="tournament-divisions-heading">
        <h2
          id="tournament-divisions-heading"
          className="mb-3 text-lg font-bold text-fg"
        >
          {details.divisionsHeading}
        </h2>
        <DivisionGroups divisions={tournament.divisions} />
      </section>
    </article>
  )
}
