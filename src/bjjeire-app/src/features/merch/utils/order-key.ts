import type { OrderStatus } from '@/types/orders'

/**
 * An order's access key (research R6, ADR-0018). The API returns it once, when
 * the order is made. It is kept for this tab only, so the page Stripe returns to
 * can read the order; the emailed link carries it in the URL fragment, which
 * browsers never send to a server.
 */
export function orderKeyStorageKey(orderId: string): string {
  return `bjjeire-order-key:${orderId}`
}

export function rememberOrderKey(orderId: string, key: string): void {
  sessionStorage.setItem(orderKeyStorageKey(orderId), key)
}

/** The key from a `#key=…` fragment, or the one this tab kept. */
export function findOrderKey(orderId: string, hash: string): string | null {
  const fromLink = new URLSearchParams(hash.replace(/^#/u, '')).get('key')
  if (fromLink !== null && fromLink !== '') {
    rememberOrderKey(orderId, fromLink)
    return fromLink
  }
  return sessionStorage.getItem(orderKeyStorageKey(orderId))
}

/** How often, and how many times, the page asks after the return from Stripe (#6007). */
export const POLL_INTERVAL_MS = 2_000
export const MAX_POLLS = 30

/** Ask again only after a return from Stripe, while the webhook has not yet confirmed the order. */
export function shouldKeepPolling(
  status: OrderStatus,
  reads: number,
  returnedFromCheckout: boolean
): boolean {
  return (
    returnedFromCheckout && status === 'AWAITING_PAYMENT' && reads < MAX_POLLS
  )
}
