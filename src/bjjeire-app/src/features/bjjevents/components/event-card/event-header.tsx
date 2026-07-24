import type { JSX } from 'react'
import type { BjjEventType } from '@/types/event'
import {
  getEventTypeLabel,
  getEventTypeColorClasses,
  getEventTypeBannerGradient,
} from '@/utils/event-utils'
import { EventCardTestIds } from '@/constants/eventDataTestIds'
import { MapPinIcon } from '@heroicons/react/20/solid'
import { uiContent } from '@/config/ui-content'

const eventCard = uiContent.events.card
const { shared } = uiContent

interface EventHeaderProps {
  name: string
  types: BjjEventType[]
  county: string
  imageUrl?: string
  headingId?: string
}

export const EventHeader = function EventHeader({
  name,
  types,
  county,
  imageUrl,
  headingId,
}: EventHeaderProps): JSX.Element {
  // The first type drives the fallback banner gradient
  const primaryType = types[0] ?? ''
  const displayName = name || eventCard.fallbackName

  return (
    <header className="relative">
      <div className="relative h-40 w-full overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Poster for ${displayName}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            data-testid={EventCardTestIds.IMAGE}
          />
        ) : (
          <div
            className={`h-full w-full bg-linear-to-br ${getEventTypeBannerGradient(primaryType)}`}
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0 bg-linear-to-t from-ink-900/70 to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col gap-1.5 p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            id={headingId}
            data-testid={EventCardTestIds.NAME}
            className="text-base font-semibold leading-tight text-fg transition-colors dark:text-fg"
          >
            {displayName}
          </h3>
          {types.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1">
              {types.map(type => (
                <span
                  key={String(type)}
                  data-testid={EventCardTestIds.TYPE}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ${getEventTypeColorClasses(type)}`}
                >
                  {getEventTypeLabel(type)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center text-fg-subtle">
          <MapPinIcon
            className="mr-1 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          <span data-testid={EventCardTestIds.COUNTY} className="text-xs">
            {county} {shared.countySuffix}
          </span>
        </div>
      </div>
    </header>
  )
}
