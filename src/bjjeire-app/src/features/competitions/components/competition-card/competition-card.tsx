import { useMemo } from 'react'
import type { JSX } from 'react'
import {
  GlobeAltIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
} from '@heroicons/react/20/solid'
import type { CompetitionDto } from '@/types/competitions'
import { Card, CardContent } from '@/components/ui/card/card'
import { CardActionButton } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import {
  CompetitionsPageTestIds,
  CompetitionCardTestIds,
} from '@/constants/competitionDataTestIds'
import { formatIrishDateRange } from '@/utils/date-utils'
import { ensureExternalUrlScheme } from '@/utils/formatting-utils'
import { asArray, readString } from '@/utils/untrusted'
import { CompetitionCardHeader } from './competition-card-header'

const { card } = uiContent.competitions

interface CompetitionCardProps {
  competition: CompetitionDto
  'data-testid'?: string
}

export const CompetitionCard = function CompetitionCard({
  competition,
  'data-testid': dataTestId,
}: CompetitionCardProps): JSX.Element {
  const {
    name,
    description,
    websiteUrl,
    registrationUrl,
    tags,
    startDate,
    endDate,
    logoUrl,
  } = competition
  const dateRange = useMemo(
    () => formatIrishDateRange(startDate, endDate),
    [startDate, endDate]
  )
  const headingId = `competition-card-heading-${competition.id ?? readString(name).replaceAll(/\s+/gu, '-').toLowerCase()}`
  const websiteHref = ensureExternalUrlScheme(websiteUrl)
  const registrationHref = ensureExternalUrlScheme(registrationUrl)
  const displayName = readString(name)
  const tagList = asArray(tags)
  const rootTestId = dataTestId ?? CompetitionsPageTestIds.LIST_ITEM

  return (
    <Card
      className="relative isolate focus-within:ring-2 focus-within:ring-primary-500/60"
      data-testid={rootTestId}
      aria-labelledby={headingId}
    >
      <CompetitionCardHeader name={name} logoUrl={logoUrl} />

      <CardContent>
        {/* Header row */}
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h3
            id={headingId}
            className="text-base font-bold leading-snug text-fg"
            data-testid={CompetitionCardTestIds.NAME}
          >
            {displayName || card.fallbackName}
          </h3>
        </div>

        {/* Date */}
        {dateRange && (
          <div
            className="mb-3 flex items-center gap-1.5 text-sm text-fg-subtle"
            data-testid={CompetitionCardTestIds.DATE}
            aria-label={`${card.dateLabel}: ${dateRange}`}
          >
            <CalendarDaysIcon
              className="h-4 w-4 shrink-0 text-primary-500"
              aria-hidden="true"
            />
            <span>{dateRange}</span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p
            className="mb-4 text-sm leading-relaxed text-fg-muted"
            data-testid={CompetitionCardTestIds.DESCRIPTION}
          >
            {description}
          </p>
        )}

        {/* Tags */}
        {tagList.length > 0 && (
          <div
            className="mb-4 flex flex-wrap gap-1.5"
            aria-label={card.tagsLabel}
            data-testid={CompetitionCardTestIds.TAGS}
          >
            {tagList.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-fg-muted ring-1 ring-hairline"
                data-testid={CompetitionCardTestIds.TAG_ITEM}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <CardActionButton
            href={websiteHref}
            icon={<GlobeAltIcon className="h-4 w-4" aria-hidden="true" />}
            aria-label={`${websiteHref ? card.visitWebsiteButton : card.noWebsiteButton} ${uiContent.shared.forLabel} ${displayName}`}
            title={websiteHref ? card.visitWebsiteButton : card.noWebsiteButton}
            data-testid={CompetitionCardTestIds.WEBSITE_BUTTON}
            className="flex-1"
          >
            {websiteHref ? card.visitWebsiteButton : card.noWebsiteButton}
          </CardActionButton>

          {registrationHref && (
            <CardActionButton
              href={registrationHref}
              icon={
                <ClipboardDocumentListIcon
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              }
              aria-label={`${card.registerButton} ${uiContent.shared.forLabel} ${displayName}`}
              title={card.registerButton}
              data-testid={CompetitionCardTestIds.REGISTER_BUTTON}
              className="flex-1"
            >
              {card.registerButton}
            </CardActionButton>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
