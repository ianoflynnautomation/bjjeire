import type { JSX } from 'react'
import { TrophyIcon } from '@heroicons/react/20/solid'
import { useImageLoadState } from '@/hooks/useImageLoadState'
import { cn } from '@/lib/cn'
import { CompetitionCardTestIds } from '@/constants/competitionDataTestIds'
import { uiContent } from '@/config/ui-content'

const { card } = uiContent.competitions

interface CompetitionCardHeaderProps {
  name: string
  logoUrl?: string | null
}

export const CompetitionCardHeader = function CompetitionCardHeader({
  name,
  logoUrl,
}: CompetitionCardHeaderProps): JSX.Element {
  const { isLoaded, hasError, handleLoad, handleError } = useImageLoadState()

  const visibleLogoUrl = hasError ? null : logoUrl

  return (
    <header className="relative h-28 w-full overflow-hidden sm:h-36 md:h-40">
      {visibleLogoUrl ? (
        <>
          {!isLoaded && (
            <div
              className="absolute inset-0 animate-pulse bg-ink-200 dark:bg-ink-700"
              aria-hidden="true"
              data-testid={CompetitionCardTestIds.LOGO_SKELETON}
            />
          )}
          <img
            src={visibleLogoUrl}
            alt={`${card.logoAlt} ${name}`}
            className={cn(
              'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
              !isLoaded && 'opacity-0'
            )}
            loading="lazy"
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            data-testid={CompetitionCardTestIds.LOGO}
          />
        </>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-ink-100 dark:bg-ink-800/60"
          aria-hidden="true"
          data-testid={CompetitionCardTestIds.LOGO_FALLBACK}
        >
          <TrophyIcon className="h-16 w-16 text-ink-400 dark:text-ink-500" />
        </div>
      )}
      <div
        className="absolute inset-0 bg-linear-to-t from-ink-900/60 to-transparent"
        aria-hidden="true"
      />
    </header>
  )
}
