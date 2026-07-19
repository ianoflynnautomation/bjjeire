import { describe, it, expect, vi } from 'vitest'
import { scrollToTop } from '@/utils/scroll-utils'

describe('scrollToTop', () => {
  it('given a scrolled page, when scrollToTop is called, then the window scrolls smoothly to the top', () => {
    const spy = vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {})

    scrollToTop()

    expect(spy).toHaveBeenCalledExactlyOnceWith({ top: 0, behavior: 'smooth' })
  })
})
