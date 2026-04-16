import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useScrollToTop } from '../useScrollToTop'

describe('useScrollToTop', () => {
  it('returns a function', () => {
    vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {})
    const { result } = renderHook(() => useScrollToTop())
    expect(typeof result.current).toBe('function')
  })

  it('does not call scrollTo on mount', () => {
    const spy = vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {})
    renderHook(() => useScrollToTop())
    expect(spy).not.toHaveBeenCalled()
  })

  it('calls scrollTo with top: 0 and smooth behaviour when invoked', () => {
    const spy = vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {})
    const { result } = renderHook(() => useScrollToTop())

    act(() => {
      result.current()
    })

    expect(spy).toHaveBeenCalledExactlyOnceWith({ top: 0, behavior: 'smooth' })
  })

  it('returns the same function reference across re-renders', () => {
    vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {})
    const { result, rerender } = renderHook(() => useScrollToTop())
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })
})
