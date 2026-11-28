import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { uiContent } from '@/config/ui-content'
import { goToCheckout } from '@/lib/checkout-redirect'
import type { BasketChangeDto, CreateOrderCommand } from '@/types/orders'
import { createOrder } from '../api/orders'
import { removeFromBasket, setLineQuantity } from '../utils/basket'
import { formatPrice } from '../utils/merch-format'
import { rememberOrderKey } from '../utils/order-key'
import {
  BASKET_CHANGED,
  orderProblem,
  problemMessage,
} from '../utils/order-problem'

const { checkout: copy } = uiContent.merch

interface CheckoutInput {
  command: CreateOrderCommand
  /** Product names by id, to say which line changed. */
  names: Map<string, string>
}

function describe(change: BasketChangeDto, names: Map<string, string>): string {
  const name = names.get(change.productId) ?? copy.unknownProduct
  switch (change.reason) {
    case 'SOLD_OUT':
      return copy.changes.SOLD_OUT(
        name,
        change.sizeId,
        change.nowAvailable ?? 0
      )
    case 'PRICE_CHANGED':
      return copy.changes.PRICE_CHANGED(
        name,
        change.sizeId,
        formatPrice(change.nowPriceCents ?? 0)
      )
    case 'UNAVAILABLE':
      return copy.changes.UNAVAILABLE(name, change.sizeId)
  }
}

/** Brings the basket in line with what the API reported (#6010). */
function applyToBasket(change: BasketChangeDto): void {
  if (change.reason === 'UNAVAILABLE') {
    removeFromBasket(change.productId, change.sizeId)
  } else if (change.reason === 'SOLD_OUT') {
    setLineQuantity(change.productId, change.sizeId, change.nowAvailable ?? 0)
  }
}

/**
 * Makes the order and leaves for Stripe (#6006, #6012). A basket that changed
 * since the shopper saw it is updated and each change listed (#6010).
 */
export function useCheckout(): {
  start: (input: CheckoutInput) => void
  isPending: boolean
  error: string | null
  changes: string[]
} {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [changes, setChanges] = useState<string[]>([])
  const mutation = useMutation({
    mutationFn: ({ command }: CheckoutInput) => createOrder(command),
    onSuccess: checkout => {
      if (checkout.orderKey) {
        rememberOrderKey(checkout.orderId, checkout.orderKey)
      }
      if (!goToCheckout(checkout.checkoutUrl)) {
        setError(copy.problems.fallback)
      }
    },
    onError: (failure, { names }) => {
      const problem = orderProblem(failure)
      if (problem.type !== BASKET_CHANGED) {
        setError(problemMessage(copy.problems, problem.type))
        return
      }
      const listed = problem.lines.map(change => describe(change, names))
      if (problem.nowDeliveryCents !== null) {
        listed.push(
          copy.changes.delivery(formatPrice(problem.nowDeliveryCents))
        )
      }
      problem.lines.forEach(applyToBasket)
      setChanges(listed)
      void queryClient.invalidateQueries({ queryKey: ['merch'] })
    },
  })
  return {
    start: (input: CheckoutInput): void => {
      setError(null)
      setChanges([])
      mutation.mutate(input)
    },
    // Stays pending while the browser leaves for Checkout.
    isPending: mutation.isPending || (mutation.isSuccess && error === null),
    error,
    changes,
  }
}
