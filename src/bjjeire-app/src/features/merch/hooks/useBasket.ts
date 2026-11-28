import { useSyncExternalStore } from 'react'
import { type BasketLine, readBasket, subscribeToBasket } from '../utils/basket'

const EMPTY: BasketLine[] = []

/** The basket in this browser, kept in step with every change, in any tab. */
export function useBasket(): BasketLine[] {
  return useSyncExternalStore(subscribeToBasket, readBasket, () => EMPTY)
}
