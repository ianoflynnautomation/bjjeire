import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addToBasket,
  BASKET_STORAGE_KEY,
  basketUnits,
  clearBasket,
  MAX_UNITS_PER_LINE,
  MAX_UNITS_PER_ORDER,
  readBasket,
  removeFromBasket,
  setLineQuantity,
  subscribeToBasket,
} from '../basket'

const HARP = '0000000000000000000000a1'
const TEE = '0000000000000000000000b2'

describe('basket (research R8, #6005)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('given an empty browser, when the basket is read, then it is empty', () => {
    expect(readBasket()).toEqual([])
  })

  it('given a size is added, when the basket is stored, then only the product, size and quantity are kept under bjjeire-basket', () => {
    addToBasket(HARP, 'M', 2, 5)

    expect(JSON.parse(localStorage.getItem(BASKET_STORAGE_KEY) ?? '')).toEqual([
      { productId: HARP, sizeId: 'M', quantity: 2 },
    ])
  })

  it('given the same size is added again, when the basket is read, then the quantities add up on one line', () => {
    addToBasket(HARP, 'M', 1, 5)
    addToBasket(TEE, 'L', 1, 5)
    addToBasket(HARP, 'M', 2, 5)

    expect(readBasket()).toEqual([
      { productId: HARP, sizeId: 'M', quantity: 3 },
      { productId: TEE, sizeId: 'L', quantity: 1 },
    ])
  })

  it('given fewer are available than asked for, when a size is added, then the line stops at what is available and says how many were added', () => {
    expect(addToBasket(HARP, 'M', 2, 3)).toBe(2)
    expect(addToBasket(HARP, 'M', 2, 3)).toBe(1)
    expect(addToBasket(HARP, 'M', 1, 3)).toBe(0)

    expect(readBasket()[0]?.quantity).toBe(3)
  })

  it('given the per-line limit, when more are added, then a line never holds more than 10', () => {
    addToBasket(HARP, 'M', 8, 50)

    expect(addToBasket(HARP, 'M', 5, 50)).toBe(2)
    expect(readBasket()[0]?.quantity).toBe(MAX_UNITS_PER_LINE)
  })

  it('given the per-order limit, when more are added, then the basket never holds more than 20', () => {
    addToBasket(HARP, 'S', 10, 50)
    addToBasket(HARP, 'M', 9, 50)

    expect(addToBasket(TEE, 'L', 3, 50)).toBe(1)
    expect(basketUnits(readBasket())).toBe(MAX_UNITS_PER_ORDER)
  })

  it('given a line, when its quantity is changed, then it is capped by the limits and 0 removes it', () => {
    addToBasket(HARP, 'M', 1, 50)
    addToBasket(TEE, 'L', 1, 50)

    setLineQuantity(HARP, 'M', 4)
    expect(readBasket()[0]?.quantity).toBe(4)

    setLineQuantity(HARP, 'M', 99)
    expect(readBasket()[0]?.quantity).toBe(MAX_UNITS_PER_LINE)

    setLineQuantity(HARP, 'M', 0)
    expect(readBasket()).toEqual([{ productId: TEE, sizeId: 'L', quantity: 1 }])
  })

  it('given a line, when it is removed, then the rest stay', () => {
    addToBasket(HARP, 'M', 1, 5)
    addToBasket(HARP, 'L', 1, 5)

    removeFromBasket(HARP, 'M')

    expect(readBasket()).toEqual([
      { productId: HARP, sizeId: 'L', quantity: 1 },
    ])
  })

  it('given a basket, when it is cleared, then nothing is stored', () => {
    addToBasket(HARP, 'M', 1, 5)

    clearBasket()

    expect(readBasket()).toEqual([])
    expect(localStorage.getItem(BASKET_STORAGE_KEY)).toBeNull()
  })

  it.each([
    'not json',
    '{"productId":"x"}',
    '[{"productId":"x","sizeId":"HUGE","quantity":1}]',
    '[{"productId":"x","sizeId":"M","quantity":-1}]',
    '[{"productId":"x","sizeId":"M","quantity":1,"priceCents":1}]',
    '[{"productId":"x","sizeId":"M","quantity":11}]',
    '[{"productId":"x","sizeId":"M","quantity":1},{"productId":"x","sizeId":"M","quantity":1}]',
    '[{"productId":"x","sizeId":"S","quantity":10},{"productId":"x","sizeId":"M","quantity":10},{"productId":"x","sizeId":"L","quantity":1}]',
  ])(
    'given a corrupt or tampered entry %s, when the basket is read, then it is cleared',
    stored => {
      localStorage.setItem(BASKET_STORAGE_KEY, stored)

      expect(readBasket()).toEqual([])
      expect(localStorage.getItem(BASKET_STORAGE_KEY)).toBeNull()
    }
  )

  it('given a listener, when the basket changes, then it is told', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToBasket(listener)

    addToBasket(HARP, 'M', 1, 5)
    unsubscribe()
    clearBasket()

    expect(listener).toHaveBeenCalledTimes(1)
  })
})
