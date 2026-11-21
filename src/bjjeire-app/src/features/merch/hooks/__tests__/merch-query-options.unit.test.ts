import { describe, it, expect } from 'vitest'
import { MERCH_STALE_TIME_MS } from '../merch-query-options'

describe('merch query options', () => {
  // #6016, SC-006: a stock, price or visibility change shows on Shop within a minute.
  // The API's merch cache expires after 30 seconds; the browser must not hold a copy longer than that again.
  it('keeps a merch read fresh for at most 30 seconds', () => {
    expect(MERCH_STALE_TIME_MS).toBeLessThanOrEqual(30_000)
  })
})
