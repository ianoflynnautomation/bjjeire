import React, { memo } from 'react'
import { GymStatus } from '../../../../types/gyms'
import { Badge } from '../../../../components/ui/badge/badge';
import {
  getGymStatusLabel,
  getGymStatusColorScheme,
} from '../../../../utils/gymDisplayUtils'
import { GymCardTestIds } from '../../../../constants/gymDataTestIds'

interface GymHeaderProps {
  name: string
  county: string
  status: GymStatus
  imageUrl?: string
  'data-testid'?: string
}

export const GymHeader: React.FC<GymHeaderProps> = memo(
  ({
    name,
    county,
    status,
    imageUrl,
  }) => {
    const statusLabel = getGymStatusLabel(status)
    const statusColorScheme = getGymStatusColorScheme(status)
    const displayName = name || 'Unnamed Gym'


    return (
      <header className="relative">
        {imageUrl && (
          <div className="mb-4 h-40 w-full overflow-hidden rounded-t-md">
            <img
              src={imageUrl}
              alt={`Exterior or interior of ${displayName}`}
              className="h-full w-full object-cover"
              loading="lazy"
              data-testid={GymCardTestIds.IMAGE}
            />
          </div>
        )}
        <div
          className={`flex flex-col gap-2 ${imageUrl ? 'p-4 pt-0 sm:p-5 sm:pt-0' : 'p-4 sm:p-5 pb-2'}`}
        >
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <h3
              className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100"
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
          <p
            className="text-xs font-medium text-slate-500 dark:text-slate-400"
            data-testid={GymCardTestIds.COUNTY}
          >
            {county} County
          </p>
        </div>
      </header>
    )
  }
)
