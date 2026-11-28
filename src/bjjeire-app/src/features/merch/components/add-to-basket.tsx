import { useState, type JSX } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button/button'
import { paths } from '@/config/paths'
import { uiContent } from '@/config/ui-content'
import { BasketTestIds } from '@/constants/merchDataTestIds'
import type { ProductDto, SizeId } from '@/types/products'
import {
  addToBasket,
  basketUnits,
  MAX_UNITS_PER_ORDER,
  readBasket,
} from '../utils/basket'

const { addToBasket: copy } = uiContent.merch

interface AddToBasketProps {
  product: ProductDto
  size: SizeId | null
}

/** Puts one of the chosen size in the basket, never more than can be bought (#6005). */
export const AddToBasket = function AddToBasket({
  product,
  size,
}: AddToBasketProps): JSX.Element {
  const [message, setMessage] = useState<string | null>(null)

  const add = (): void => {
    if (size === null) {
      return
    }
    const available =
      product.sizes.find(entry => entry.id === size)?.available ?? 0
    if (basketUnits(readBasket()) >= MAX_UNITS_PER_ORDER) {
      setMessage(copy.basketFull)
      return
    }
    const added = addToBasket(product.id, size, 1, available)
    setMessage(added === 0 ? copy.noneAdded(size) : copy.added(size))
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={add}
        disabled={size === null || product.soldOut}
        size="lg"
        data-testid={BasketTestIds.ADD}
      >
        {copy.button}
      </Button>
      {size === null && !product.soldOut && (
        <p className="text-sm text-fg-subtle">{copy.chooseSize}</p>
      )}
      {message !== null && (
        <p
          role="status"
          className="text-sm text-fg"
          data-testid={BasketTestIds.ADD_MESSAGE}
        >
          {message}{' '}
          <Link
            to={paths.basket.getHref()}
            className="font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
          >
            {copy.viewBasket}
          </Link>
        </p>
      )}
    </div>
  )
}
