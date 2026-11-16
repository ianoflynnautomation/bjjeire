import { describe, it, expect } from 'vitest'
import { isStripeCheckoutUrl } from '../checkout-redirect'

describe('isStripeCheckoutUrl', () => {
  it('given a Stripe hosted Checkout address, when checked, then it is allowed', () => {
    expect(
      isStripeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_1#abc')
    ).toBe(true)
  })

  it.each([
    'http://checkout.stripe.com/c/pay/cs_test_1',
    'https://checkout.stripe.com.evil.test/c/pay',
    'https://evil.test/?next=https://checkout.stripe.com',
    'javascript:alert(1)',
    '/tournaments',
    '',
  ])('given %s, when checked, then it is refused', url => {
    expect(isStripeCheckoutUrl(url)).toBe(false)
  })
})
