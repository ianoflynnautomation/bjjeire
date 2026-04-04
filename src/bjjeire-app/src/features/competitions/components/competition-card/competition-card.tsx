import { memo, useMemo } from 'react'
import type { JSX } from 'react'
import {
  GlobeAltIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
} from '@heroicons/react/20/solid'
import { format, parseISO, isSameDay, isSameMonth, isSameYear } from 'date-fns'
import type { CompetitionDto } from '@/types/competitions'
import { COMPETITION_ORGANISATION_LABELS } from '@/types/competitions'
import { Card, CardContent } from '@/components/ui/card/card'
import { CardActionButton } from '@/components/ui/button/button'
import { Badge } from '@/components/ui/badge/badge'
import { uiContent } from '@/config/ui-content'
import {
  CompetitionsPageTestIds,
  CompetitionCardTestIds,
} from '@/constants/competitionDataTestIds'

const { card } = uiContent.competitions

function formatDateRange(startDate?: string, endDate?: string): string | null {
  if (!startDate) {
    return null
  }
  const start = parseISO(startDate)
  if (!endDate || isSameDay(start, parseISO(endDate))) {
    return format(start, 'd MMMM yyyy')
  }
  const end = parseISO(endDate)
  if (isSameMonth(start, end)) {
    return `${format(start, 'd')}–${format(end, 'd MMMM yyyy')}`
  }
  if (isSameYear(start, end)) {
    return `${format(start, 'd MMMM')} – ${format(end, 'd MMMM yyyy')}`
  }
  return `${format(start, 'd MMMM yyyy')} – ${format(end, 'd MMMM yyyy')}`
}

interface CompetitionCardProps {
  competition: CompetitionDto
  'data-testid'?: string
}

export const CompetitionCard = memo(function CompetitionCard({
  competition,
  'data-testid': dataTestId,
}: CompetitionCardProps): JSX.Element {
  const {
    name,
    organisation,
    description,
    websiteUrl,
    registrationUrl,
    tags,
    startDate,
    endDate,
  } = competition
  const dateRange = useMemo(
    () => formatDateRange(startDate, endDate),
    [startDate, endDate]
  )
  const headingId = `competition-card-heading-${competition.id ?? name.replaceAll(/\s+/gu, '-').toLowerCase()}`
  const rootTestId = dataTestId ?? CompetitionsPageTestIds.LIST_ITEM
  const orgLabel =
    COMPETITION_ORGANISATION_LABELS[organisation] ?? String(organisation)

  return (
    <Card
      className="relative isolate focus-within:ring-2 focus-within:ring-emerald-500/60"
      data-testid={rootTestId}
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-emerald-400/40 to-transparent"
        aria-hidden="true"
      />

      <CardContent>
        {/* Header row */}
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h3
            id={headingId}
            className="text-base font-bold leading-snug text-slate-900 dark:text-white"
            data-testid={CompetitionCardTestIds.NAME}
          >
            {name || card.fallbackName}
          </h3>
          <Badge
            text={orgLabel}
            colorScheme="emerald"
            size="sm"
            data-testid={CompetitionCardTestIds.ORGANISATION}
          />
        </div>

        {/* Date */}
        {dateRange && (
          <div
            className="mb-3 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"
            data-testid={CompetitionCardTestIds.DATE}
            aria-label={`${card.dateLabel}: ${dateRange}`}
          >
            <CalendarDaysIcon
              className="h-4 w-4 shrink-0 text-emerald-500"
              aria-hidden="true"
            />
            <span>{dateRange}</span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p
            className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
            data-testid={CompetitionCardTestIds.DESCRIPTION}
          >
            {description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div
            className="mb-4 flex flex-wrap gap-1.5"
            aria-label={card.tagsLabel}
            data-testid={CompetitionCardTestIds.TAGS}
          >
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:ring-slate-600"
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
            href={websiteUrl || undefined}
            icon={<GlobeAltIcon className="h-4 w-4" aria-hidden="true" />}
            aria-label={`${websiteUrl ? card.visitWebsiteButton : card.noWebsiteButton} for ${name}`}
            title={websiteUrl ? card.visitWebsiteButton : card.noWebsiteButton}
            data-testid={CompetitionCardTestIds.WEBSITE_BUTTON}
            className="flex-1"
          >
            {websiteUrl ? card.visitWebsiteButton : card.noWebsiteButton}
          </CardActionButton>

          {registrationUrl && (
            <CardActionButton
              href={registrationUrl}
              icon={
                <ClipboardDocumentListIcon
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              }
              aria-label={`${card.registerButton} for ${name}`}
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
})
