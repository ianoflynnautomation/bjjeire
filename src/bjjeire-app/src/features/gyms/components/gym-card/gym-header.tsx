import { memo, useState, useCallback } from 'react'
import type { JSX } from 'react'
import type { GymStatus } from '@/types/gyms'
import { Badge } from '@/components/ui/badge/badge'
import {
  getGymStatusLabel,
  getGymStatusColorScheme,
} from '@/utils/gym-display-utils'
import { GymCardTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'
import { MapPinIcon, BuildingStorefrontIcon } from '@heroicons/react/20/solid'
import { cn } from '@/lib/cn'

const gymCard = uiContent.gyms.card
const { shared } = uiContent

interface GymHeaderProps {
  name: string
  county: string
  status: GymStatus
  imageUrl?: string
  thumbnailUrl?: string
  headingId?: string
}

export const GymHeader = memo(function GymHeader({
  name,
  county,
  status,
  imageUrl,
  thumbnailUrl,
  headingId,
}: GymHeaderProps): JSX.Element {
  const [imgError, setImgError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const handleImageError = useCallback(() => {
    setImgError(true)
  }, [])
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const statusLabel = getGymStatusLabel(status)
  const statusColorScheme = getGymStatusColorScheme(status)
  const displayName = name || gymCard.fallbackName
  const showImage = Boolean(imageUrl) && !imgError

  return (
    <header className="relative">
      <div className="relative h-28 w-full overflow-hidden sm:h-36 md:h-40">
        {showImage ? (
          <>
            {!isLoaded && (
              <div
                className="absolute inset-0 animate-pulse bg-slate-700"
                aria-hidden="true"
                data-testid={GymCardTestIds.IMAGE_SKELETON}
              />
            )}
            <img
              src={imageUrl}
              srcSet={
                thumbnailUrl
                  ? `${thumbnailUrl} 200w, ${imageUrl} 1200w`
                  : undefined
              }
              sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(50vw - 2rem), 400px"
              alt={`${gymCard.imageAlt} ${displayName}`}
              className={cn(
                'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
                !isLoaded && 'opacity-0'
              )}
              loading="lazy"
              decoding="async"
              onLoad={handleImageLoad}
              onError={handleImageError}
              data-testid={GymCardTestIds.IMAGE}
            />
          </>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-slate-800/60"
            aria-hidden="true"
            data-testid={GymCardTestIds.IMAGE_FALLBACK}
          >
            <BuildingStorefrontIcon className="h-16 w-16 text-slate-600" />
          </div>
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
