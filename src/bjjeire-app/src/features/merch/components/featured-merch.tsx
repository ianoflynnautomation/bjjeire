import type { CSSProperties, JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { MerchFeaturedTestIds } from '@/constants/merchDataTestIds'
import { useMerchProducts } from '../hooks/useMerchProducts'
import { ProductCard } from './product-card'

const { section } = uiContent.merch

/**
 * BJJ Éire's own merch, shown above the store directory on Shop (#6001).
 * Renders nothing while loading, on error or when no product is published
 * (#6003): there is no placeholder.
 */
export const FeaturedMerch = function FeaturedMerch(): JSX.Element | null {
  const products = useMerchProducts()
  if (products.length === 0) {
    return null
  }

  return (
    <section
      className="mb-8"
      aria-labelledby="featured-merch-heading"
      data-testid={MerchFeaturedTestIds.SECTION}
    >
      <h2
        id="featured-merch-heading"
        className="display-expanded text-xl font-bold text-fg"
      >
        {section.title}
      </h2>
      <p className="mb-4 text-sm text-fg-subtle">{section.intro}</p>
      <ul
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        aria-label={section.ariaLabel}
        data-testid={MerchFeaturedTestIds.LIST}
      >
        {products.map((product, index) => (
          <li
            key={product.id}
            className="animate-rise"
            style={{ '--i': index } as CSSProperties}
          >
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}
