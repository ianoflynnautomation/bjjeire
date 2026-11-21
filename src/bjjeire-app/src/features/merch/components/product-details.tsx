import { useState, type JSX } from 'react'
import { Link } from 'react-router'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { ProductPageTestIds } from '@/constants/merchDataTestIds'
import type { ProductDto, SizeId } from '@/types/products'
import { formatPrice, productPhotoUrl } from '../utils/merch-format'
import { SizePicker } from './size-picker'

const { product: copy, kinds } = uiContent.merch

interface ProductDetailsProps {
  product: ProductDto
}

/** A published product's photos, description, price and sizes (#6002). */
export const ProductDetails = function ProductDetails({
  product,
}: ProductDetailsProps): JSX.Element {
  const [size, setSize] = useState<SizeId | null>(null)
  const total = product.photos.length

  return (
    <article className="space-y-8" data-testid={ProductPageTestIds.ROOT}>
      <Link
        to={paths.shop.getHref()}
        className="rounded-sm text-sm font-semibold text-primary-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:text-primary-300"
      >
        {copy.backLink}
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <ul
          className="grid gap-3"
          aria-label={copy.photosLabel}
          data-testid={ProductPageTestIds.PHOTOS}
        >
          {product.photos.map((photo, index) => (
            <li
              key={photo}
              className="overflow-hidden rounded-xl bg-ink-50 ring-1 ring-hairline"
            >
              <img
                src={productPhotoUrl(photo)}
                alt={copy.photoAlt(product.name, index + 1, total)}
                className="aspect-square w-full object-contain"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                data-testid={ProductPageTestIds.PHOTO}
              />
            </li>
          ))}
        </ul>

        <div className="space-y-4">
          <p
            className="text-sm font-semibold uppercase tracking-wide text-fg-subtle"
            data-testid={ProductPageTestIds.KIND}
          >
            {kinds[product.kind]}
          </p>
          <h1
            className="display-expanded text-3xl font-bold text-fg"
            data-testid={ProductPageTestIds.NAME}
          >
            {product.name}
          </h1>
          <p
            className="text-2xl font-semibold text-fg"
            data-testid={ProductPageTestIds.PRICE}
          >
            {formatPrice(product.priceCents, product.currency)}
          </p>
          <p
            className="whitespace-pre-line text-fg-subtle"
            data-testid={ProductPageTestIds.DESCRIPTION}
          >
            {product.description}
          </p>
          <SizePicker
            sizes={product.sizes}
            value={size}
            onChange={setSize}
            dataTestId={ProductPageTestIds.SIZES}
            sizeTestId={ProductPageTestIds.SIZE}
          />
          {product.soldOut && (
            <p role="status" className="text-sm font-semibold text-fg-muted">
              {copy.allSoldOut}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
