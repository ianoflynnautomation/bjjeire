/** Stripe hosted Checkout's origin (ADR-0013). Nothing else is ever navigated to from an API value. */
const CHECKOUT_ORIGIN = 'https://checkout.stripe.com'

export function isStripeCheckoutUrl(value: string): boolean {
  try {
    return new URL(value).origin === CHECKOUT_ORIGIN
  } catch {
    return false
  }
}

/**
 * Leaves the site for Stripe's payment page. A full page load, not a router
 * navigation, because Checkout is another origin; any other address is
 * refused so an API value can never send the competitor or shopper
 * elsewhere. Used by sign-ups and the shop (ADR-0013, ADR-0016).
 *
 * @returns false when the address is not a Stripe Checkout page
 */
export function goToCheckout(url: string): boolean {
  if (!isStripeCheckoutUrl(url)) {
    return false
  }
  window.location.assign(url)
  return true
}
