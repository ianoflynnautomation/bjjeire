import type { JSX } from 'react'
import { ShoppingBagIcon } from '@heroicons/react/20/solid'
import { useImageLoadState } from '@/hooks/useImageLoadState'
import { cn } from '@/lib/cn'
import { StoresCardTestIds } from '@/constants/storeDataTestIds'
import { uiContent } from '@/config/ui-content'

const { card } = uiContent.stores

interface StoreCardHeaderProps {
  name: string
  logoUrl?: string | null
}

export const StoreCardHeader = function StoreCardHeader({
  name,
  logoUrl,
}: StoreCardHeaderProps): JSX.Element {
  const { isLoaded, hasError, handleLoad, handleError } = useImageLoadState()

  const visibleLogoUrl = hasError ? null : logoUrl

  return (
    <header className="relative h-28 w-full overflow-hidden sm:h-36 md:h-40">
      {visibleLogoUrl ? (
        <>
          {!isLoaded && (
            <div
              className="absolute inset-0 animate-pulse bg-slate-700"
              aria-hidden="true"
              data-testid={StoresCardTestIds.LOGO_SKELETON}
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
            data-testid={StoresCardTestIds.LOGO}
          />
        </>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-slate-800/60"
          aria-hidden="true"
          data-testid={StoresCardTestIds.LOGO_FALLBACK}
        >
          <ShoppingBagIcon className="h-16 w-16 text-slate-600" />
        </div>
      )}
      <div
        className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent"
        aria-hidden="true"
      />
    </header>
  )
}
