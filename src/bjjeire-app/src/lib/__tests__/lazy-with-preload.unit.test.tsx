import { Suspense, useEffect, type JSX } from 'react'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { lazyWithPreload } from '@/lib/lazy-with-preload'

function Page(): JSX.Element {
  return <p>page content</p>
}

const loadPage = (): Promise<{ default: typeof Page }> =>
  Promise.resolve({ default: Page })

describe('lazyWithPreload', () => {
  it('given a preloaded component, when it first renders, then the Suspense fallback never commits', async () => {
    const Preloadable = lazyWithPreload(loadPage)
    await Preloadable.preload()

    render(
      <Suspense fallback={<p>loading</p>}>
        <Preloadable />
      </Suspense>
    )

    expect(screen.getByText('page content')).toBeInTheDocument()
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
  })

  it('given no preload, when it renders, then it behaves like React.lazy', async () => {
    const Preloadable = lazyWithPreload(loadPage)

    render(
      <Suspense fallback={<p>loading</p>}>
        <Preloadable />
      </Suspense>
    )

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(await screen.findByText('page content')).toBeInTheDocument()
  })

  it('given a mounted component, when a preload finishes afterwards, then it does not remount', async () => {
    const onMount = vi.fn()
    function Tracked(): JSX.Element {
      useEffect(() => {
        onMount()
      }, [])
      return <p>page content</p>
    }
    const Preloadable = lazyWithPreload(() =>
      Promise.resolve({ default: Tracked })
    )
    const tree = (): JSX.Element => (
      <Suspense fallback={<p>loading</p>}>
        <Preloadable />
      </Suspense>
    )

    const { rerender } = render(tree())
    await screen.findByText('page content')
    await act(() => Preloadable.preload())
    rerender(tree())

    expect(onMount).toHaveBeenCalledOnce()
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
  })

  it('given a failing load, when preloaded, then the rejection reaches the caller', async () => {
    const Preloadable = lazyWithPreload(() =>
      Promise.reject(new Error('chunk failed'))
    )

    await expect(Preloadable.preload()).rejects.toThrow('chunk failed')
  })
})
