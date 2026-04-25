import { memo, useState, useCallback } from 'react'
import type { JSX } from 'react'
import { TrophyIcon } from '@heroicons/react/20/solid'
import { cn } from '@/lib/cn'
import { CompetitionCardTestIds } from '@/constants/competitionDataTestIds'
import { uiContent } from '@/config/ui-content'

const { card } = uiContent.competitions

interface CompetitionCardHeaderProps {
  name: string
  logoUrl?: string | null
}

export const CompetitionCardHeader = memo(function CompetitionCardHeader({
  name,
  logoUrl,
}: CompetitionCardHeaderProps): JSX.Element {
  const [imgError, setImgError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const handleImageError = useCallback(() => setImgError(true), [])
  const handleImageLoad = useCallback(() => setIsLoaded(true), [])

  const showImage = Boolean(logoUrl) && !imgError

  return (
    <header className="relative h-28 w-full overflow-hidden sm:h-36 md:h-40">
      {showImage ? (
        <>
          {!isLoaded && (
            <div
              className="absolute inset-0 animate-pulse bg-slate-700"
              aria-hidden="true"
              data-testid={CompetitionCardTestIds.LOGO_SKELETON}
            />
          )}
          <img
            src={logoUrl!}
            alt={`${card.logoAlt} ${name}`}
            className={cn(
              'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
              !isLoaded && 'opacity-0'
            )}
            loading="lazy"
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
            data-testid={CompetitionCardTestIds.LOGO}
          />
        </>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-slate-800/60"
          aria-hidden="true"
          data-testid={CompetitionCardTestIds.LOGO_FALLBACK}
        >
          <TrophyIcon className="h-16 w-16 text-slate-600" />
        </div>
      )}
      <div
        className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent"
        aria-hidden="true"
      />
    </header>
  )
})
