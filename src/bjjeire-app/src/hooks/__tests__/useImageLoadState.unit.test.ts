import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useImageLoadState } from '@/hooks/useImageLoadState'

describe('useImageLoadState', () => {
  it('given a fresh hook, when it first renders, then the image is neither loaded nor errored', () => {
    const { result } = renderHook(() => useImageLoadState())
    expect(result.current.hasError).toBe(false)
    expect(result.current.isLoaded).toBe(false)
  })

  it('given a loading image, when the load handler fires, then the image is marked loaded', () => {
    const { result } = renderHook(() => useImageLoadState())

    act(() => {
      result.current.handleLoad()
    })

    expect(result.current.isLoaded).toBe(true)
    expect(result.current.hasError).toBe(false)
  })

  it('given a loading image, when the error handler fires, then the image is marked errored', () => {
    const { result } = renderHook(() => useImageLoadState())

    act(() => {
      result.current.handleError()
    })

    expect(result.current.hasError).toBe(true)
    expect(result.current.isLoaded).toBe(false)
  })

  it('given re-renders, when the handlers are read again, then their references are unchanged', () => {
    const { result, rerender } = renderHook(() => useImageLoadState())
    const { handleLoad, handleError } = result.current

    rerender()

    expect(result.current.handleLoad).toBe(handleLoad)
    expect(result.current.handleError).toBe(handleError)
  })
})
