import type { JSX, ReactNode } from 'react'
import { Link } from 'react-router'
import { TricolorEdge } from '@/components/ui/decoration/tricolor-edge'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionPageTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import { BjjEireCompetitionSignUpTestIds } from '@/constants/registrationDataTestIds'
import { buttonVariants } from '@/lib/button-variants'
import type { BjjEireCompetitionDto } from '@/types/bjjeire-competitions'
import { formatDate } from '@/utils/date-utils'
import { formatDublinDateTime } from '@/utils/dublin-time'
import { readString } from '@/utils/untrusted'
import {
  formatEntryFee,
  registrationMessage,
} from '../utils/bjjeire-competition-format'
import { DivisionGroups } from './division-groups'
import { RegistrationStateBadge } from './registration-state-badge'

const { details, registration } = uiContent.bjjEireCompetitions

interface BjjEireCompetitionDetailsProps {
  bjjEireCompetition: BjjEireCompetitionDto
  /** Shown after the divisions, such as the public competitor list. */
  children?: ReactNode
}

const factLabelClass =
  'text-xs font-semibold uppercase tracking-wider text-fg-subtle'
const factValueClass = 'mt-1 text-sm text-fg'

export const BjjEireCompetitionDetails = function BjjEireCompetitionDetails({
  bjjEireCompetition,
  children,
}: BjjEireCompetitionDetailsProps): JSX.Element {
  const venueName = readString(bjjEireCompetition.venue?.venue)
  const venueAddress = readString(bjjEireCompetition.venue?.address)
  const hasLimit =
    bjjEireCompetition.competitorLimit !== null &&
    bjjEireCompetition.competitorLimit !== undefined

  return (
    <article data-testid={BjjEireCompetitionPageTestIds.ROOT}>
      <Link
        to={paths.competitions.getHref()}
        className="mb-4 inline-block rounded-sm text-sm font-semibold text-primary-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:text-primary-300"
        data-testid={BjjEireCompetitionPageTestIds.BACK_LINK}
      >
        {`← ${details.backLink}`}
      </Link>

      <header className="relative mb-8 overflow-hidden rounded-xl bg-surface-solid px-5 py-6 ring-1 ring-hairline sm:px-7">
        <TricolorEdge />
        <div className="relative">
          <h1
            className="display-expanded text-3xl font-bold text-fg sm:text-4xl"
            data-testid={BjjEireCompetitionPageTestIds.NAME}
          >
            {bjjEireCompetition.name}
          </h1>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className={factLabelClass}>{details.dateLabel}</dt>
              <dd
                className={factValueClass}
                data-testid={BjjEireCompetitionPageTestIds.DATE}
              >
                {formatDate(bjjEireCompetition.date)}
              </dd>
            </div>
            <div>
              <dt className={factLabelClass}>{details.venueLabel}</dt>
              <dd
                className={factValueClass}
                data-testid={BjjEireCompetitionPageTestIds.VENUE}
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
                data-testid={BjjEireCompetitionPageTestIds.FEE}
              >
                <span className="font-semibold">
                  {formatEntryFee(
                    bjjEireCompetition.entryFeeCents,
                    bjjEireCompetition.currency
                  )}
                </span>{' '}
                <span className="text-fg-muted">{details.feeNote}</span>
              </dd>
            </div>
            <div>
              <dt className={factLabelClass}>{details.windowLabel}</dt>
              <dd
                className={factValueClass}
                data-testid={BjjEireCompetitionPageTestIds.WINDOW}
              >
                {`${formatDublinDateTime(bjjEireCompetition.registrationOpensAt)} ${details.windowSeparator} ${formatDublinDateTime(bjjEireCompetition.registrationClosesAt)}`}{' '}
                <span className="text-fg-muted">{`(${details.timeZoneNote})`}</span>
              </dd>
            </div>
            {hasLimit && (
              <div>
                <dt className={factLabelClass}>{details.placesLabel}</dt>
                <dd
                  className={factValueClass}
                  data-testid={BjjEireCompetitionPageTestIds.PLACES}
                >
                  {`${bjjEireCompetition.placesTaken} ${details.placesSeparator} ${bjjEireCompetition.competitorLimit} ${details.placesTakenSuffix}`}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      <section
        aria-labelledby="bjjeire-competition-registration-heading"
        className="mb-8 rounded-xl bg-surface-solid p-5 ring-1 ring-hairline sm:px-7"
        data-testid={BjjEireCompetitionPageTestIds.REGISTRATION_STATUS}
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="bjjeire-competition-registration-heading"
            className="text-lg font-bold text-fg"
          >
            {registration.heading}
          </h2>
          <RegistrationStateBadge
            status={bjjEireCompetition.status}
            registrationState={bjjEireCompetition.registrationState}
          />
        </div>
        <p
          className="mt-2 text-sm text-fg-muted"
          data-testid={BjjEireCompetitionPageTestIds.REGISTRATION_MESSAGE}
        >
          {registrationMessage(bjjEireCompetition)}
        </p>
        {bjjEireCompetition.status === 'PUBLISHED' &&
          bjjEireCompetition.registrationState === 'OPEN' && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link
                to={paths.bjjEireCompetitionSignUp.getHref(
                  bjjEireCompetition.slug
                )}
                className={buttonVariants({ size: 'lg' })}
                data-testid={BjjEireCompetitionSignUpTestIds.SIGN_UP_LINK}
              >
                {uiContent.registrations.callToAction.signUp}
              </Link>
              <Link
                to={paths.accountSignUps.getHref()}
                className="text-sm font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
                data-testid={BjjEireCompetitionSignUpTestIds.MY_SIGN_UPS_LINK}
              >
                {uiContent.registrations.callToAction.mySignUps}
              </Link>
            </div>
          )}
      </section>

      {bjjEireCompetition.description && (
        <section
          aria-labelledby="bjjeire-competition-about-heading"
          className="mb-8"
        >
          <h2
            id="bjjeire-competition-about-heading"
            className="mb-3 text-lg font-bold text-fg"
          >
            {details.aboutHeading}
          </h2>
          <p
            className="whitespace-pre-line text-sm leading-relaxed text-fg-muted"
            data-testid={BjjEireCompetitionPageTestIds.DESCRIPTION}
          >
            {bjjEireCompetition.description}
          </p>
        </section>
      )}

      <section aria-labelledby="bjjeire-competition-divisions-heading">
        <h2
          id="bjjeire-competition-divisions-heading"
          className="mb-3 text-lg font-bold text-fg"
        >
          {details.divisionsHeading}
        </h2>
        <DivisionGroups divisions={bjjEireCompetition.divisions} />
      </section>
      {children}
    </article>
  )
}
