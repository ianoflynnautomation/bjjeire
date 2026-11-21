import type { JSX } from 'react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge/badge'
import { Card, CardContent } from '@/components/ui/card/card'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import {
  MerchCardTestIds,
  MerchFeaturedTestIds,
} from '@/constants/merchDataTestIds'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/cn'
import type { ProductSummaryDto } from '@/types/products'
import { formatPrice, productPhotoUrl } from '../utils/merch-format'

const { card, kinds } = uiContent.merch

interface ProductCardProps {
  product: ProductSummaryDto
  dataTestId?: string
}

export const ProductCard = function ProductCard({
  product,
  dataTestId = MerchFeaturedTestIds.CARD,
}: ProductCardProps): JSX.Element {
  const headingId = `merch-card-heading-${product.id}`

  return (
    <Card
      className="relative isolate focus-within:ring-2 focus-within:ring-primary-500/60"
      data-testid={dataTestId}
      aria-labelledby={headingId}
    >
      <header className="h-40 w-full overflow-hidden bg-ink-50 sm:h-48">
        {product.photo && (
          // object-contain: a photo or a logo is never cropped (the lesson of #3006).
          <img
            src={productPhotoUrl(product.photo)}
            alt={product.name}
            className="h-full w-full object-contain"
            loading="lazy"
            decoding="async"
            data-testid={MerchCardTestIds.IMAGE}
          />
        )}
      </header>

      <CardContent>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h3
            id={headingId}
            className="text-base font-bold leading-snug text-fg"
            data-testid={MerchCardTestIds.NAME}
          >
            {product.name}
          </h3>
          {product.soldOut && (
            <Badge
              text={card.outOfStock}
              colorScheme="slate"
              data-testid={MerchCardTestIds.OUT_OF_STOCK}
            />
          )}
        </div>

        <dl className="mb-4 space-y-1.5 text-sm text-fg-subtle">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{card.kindLabel}</dt>
            <dd data-testid={MerchCardTestIds.KIND}>{kinds[product.kind]}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{card.priceLabel}</dt>
            <dd
              className="text-base font-semibold text-fg"
              data-testid={MerchCardTestIds.PRICE}
            >
              {formatPrice(product.priceCents, product.currency)}
            </dd>
          </div>
        </dl>

        <Link
          to={paths.product.getHref(product.slug)}
          aria-label={`${card.viewButton}: ${product.name}`}
          className={cn(buttonVariants({ variant: 'solid' }), 'mt-auto')}
          data-testid={MerchCardTestIds.LINK}
        >
          {card.viewButton}
        </Link>
      </CardContent>
    </Card>
  )
}
