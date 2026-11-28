import type { JSX } from 'react'
import { Link } from 'react-router'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { BasketTestIds } from '@/constants/merchDataTestIds'
import { cn } from '@/lib/cn'
import { useBasket } from '../hooks/useBasket'
import { basketUnits } from '../utils/basket'

const { basketBadge: copy } = uiContent.merch

interface BasketBadgeProps {
  className?: string
}

/** The basket in the navigation, with how many items it holds. Shown only while merch is on (#6026). */
export const BasketBadge = function BasketBadge({
  className,
}: BasketBadgeProps): JSX.Element {
  const units = basketUnits(useBasket())
  return (
    <Link
      to={paths.basket.getHref()}
      className={cn('relative', className)}
      aria-label={copy.label(units)}
      data-testid={BasketTestIds.BADGE}
    >
      <ShoppingBagIcon className="h-5 w-5" aria-hidden="true" />
      {units > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1 text-xs font-bold text-white"
          aria-hidden="true"
          data-testid={BasketTestIds.BADGE_COUNT}
        >
          {units}
        </span>
      )}
    </Link>
  )
}
