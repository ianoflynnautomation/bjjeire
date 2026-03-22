import { memo } from 'react'
import type { GymStatus } from '@/types/gyms'
import { Badge } from '@/components/ui/badge/badge'
import {
  getGymStatusLabel,
  getGymStatusColorScheme,
} from '@/utils/gymDisplayUtils'
import { GymCardTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'
import { MapPinIcon } from '@heroicons/react/20/solid'

const gymCard = uiContent.gyms.card
const { shared } = uiContent

interface GymHeaderProps {
  name: string
  county: string
  status: GymStatus
  imageUrl?: string
  headingId?: string
}

export const GymHeader = memo(function GymHeader({
  name,
  county,
  status,
  imageUrl,
  headingId,
}: GymHeaderProps) {
  const statusLabel = getGymStatusLabel(status)
  const statusColorScheme = getGymStatusColorScheme(status)
  const displayName = name || gymCard.fallbackName

  return (
    <header className="relative">
      <div className="relative h-28 w-full overflow-hidden sm:h-36 md:h-40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Exterior or interior of ${displayName}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            data-testid={GymCardTestIds.IMAGE}
          />
        ) : (
          <div
            className="h-full w-full bg-linear-to-br from-emerald-100 via-slate-100 to-white dark:from-emerald-900/70 dark:via-slate-800/40 dark:to-slate-900/20"
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent"
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-1.5 p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <h3
            id={headingId}
            className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-50"
            aria-label={`Gym name: ${displayName}`}
            data-testid={GymCardTestIds.NAME}
          >
            {displayName}
          </h3>
          <Badge
            text={statusLabel}
            colorScheme={statusColorScheme}
            data-testid={GymCardTestIds.STATUS_BADGE}
          />
        </div>
        <div
          className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"
          data-testid={GymCardTestIds.COUNTY}
        >
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {county} {shared.countySuffix}
          </span>
        </div>
      </div>
    </header>
  )
})
