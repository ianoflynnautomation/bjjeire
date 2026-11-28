import type { JSX } from 'react'
import { Link } from 'react-router'
import { TrashIcon } from '@heroicons/react/24/outline'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { BasketTestIds } from '@/constants/merchDataTestIds'
import type { BasketLineView } from '../hooks/useBasketView'
import {
  basketUnits,
  MAX_UNITS_PER_LINE,
  MAX_UNITS_PER_ORDER,
  removeFromBasket,
  setLineQuantity,
} from '../utils/basket'
import { formatPrice, productPhotoUrl } from '../utils/merch-format'

const { basket: copy, checkout } = uiContent.merch

interface BasketLinesProps {
  lines: BasketLineView[]
}

function problemText(line: BasketLineView): string | null {
  if (line.problem === 'UNAVAILABLE') {
    return copy.unavailable
  }
  if (line.problem === 'SOLD_OUT') {
    return copy.soldOut
  }
  if (line.available !== null && line.quantity > line.available) {
    return copy.fewerLeft(line.available)
  }
  return null
}

/** Each basket line with its quantity, item price and line total, changeable and removable (#6005). */
export const BasketLines = function BasketLines({
  lines,
}: BasketLinesProps): JSX.Element {
  const units = basketUnits(lines)
  return (
    <ul className="divide-y divide-hairline">
      {lines.map(line => {
        const name = line.name ?? checkout.unknownProduct
        const problem = problemText(line)
        const largest = Math.max(
          1,
          Math.min(
            MAX_UNITS_PER_LINE,
            line.available ?? MAX_UNITS_PER_LINE,
            MAX_UNITS_PER_ORDER - (units - line.quantity)
          )
        )
        // A line that now asks for more than is left still shows what it holds (QA 3).
        const quantities = Array.from(
          { length: Math.max(largest, line.quantity) },
          (_unused, index) => index + 1
        )
        return (
          <li
            key={`${line.productId}-${line.sizeId}`}
            className="flex flex-wrap items-center gap-4 py-4"
            data-testid={BasketTestIds.LINE}
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-50 ring-1 ring-hairline">
              {line.photo && (
                <img
                  src={productPhotoUrl(line.photo)}
                  alt=""
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <div className="min-w-40 flex-1">
              <p
                className="font-semibold text-fg"
                data-testid={BasketTestIds.LINE_NAME}
              >
                {line.slug ? (
                  <Link
                    to={paths.product.getHref(line.slug)}
                    className="underline-offset-2 hover:underline"
                  >
                    {name}
                  </Link>
                ) : (
                  name
                )}
              </p>
              <p
                className="text-sm text-fg-subtle"
                data-testid={BasketTestIds.LINE_SIZE}
              >
                {copy.size(line.sizeId)}
              </p>
              {line.unitPriceCents !== null && (
                <p
                  className="text-sm text-fg-subtle"
                  data-testid={BasketTestIds.LINE_PRICE}
                >
                  {copy.each(formatPrice(line.unitPriceCents))}
                </p>
              )}
              {problem !== null && (
                <p
                  role="status"
                  className="mt-1 text-sm font-semibold text-fg"
                  data-testid={BasketTestIds.LINE_PROBLEM}
                >
                  {problem}
                </p>
              )}
            </div>
            {line.problem === null && (
              <select
                value={String(line.quantity)}
                onChange={event =>
                  setLineQuantity(
                    line.productId,
                    line.sizeId,
                    Number(event.target.value)
                  )
                }
                aria-label={copy.quantityLabel(name, line.sizeId)}
                className="min-h-11 rounded-lg bg-surface-solid px-3 text-fg ring-1 ring-hairline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
                data-testid={BasketTestIds.LINE_QUANTITY}
              >
                {quantities.map(quantity => (
                  <option key={quantity} value={String(quantity)}>
                    {quantity}
                  </option>
                ))}
              </select>
            )}
            {line.problem === null && line.unitPriceCents !== null && (
              <p
                className="w-24 text-right font-semibold text-fg"
                data-testid={BasketTestIds.LINE_TOTAL}
              >
                {formatPrice(line.unitPriceCents * line.quantity)}
              </p>
            )}
            <button
              type="button"
              onClick={() => removeFromBasket(line.productId, line.sizeId)}
              aria-label={copy.remove(name, line.sizeId)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-fg-subtle hover:bg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
              data-testid={BasketTestIds.LINE_REMOVE}
            >
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
