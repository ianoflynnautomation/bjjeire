import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePaginatedQuery } from '../usePaginatedQuery'
import { makeHookWrapper } from '@/testing/render-utils'
import type { PaginatedResponse } from '@/types/common'

interface TestItem {
  id: number
  name: string
}

interface FilterParams {
  category?: string
  page?: number
}

function makePage(
  items: TestItem[],
  overrides: Partial<PaginatedResponse<TestItem>['pagination']> = {}
): PaginatedResponse<TestItem> {
  return {
    data: items,
    pagination: {
      totalItems: items.length,
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPageUrl: null,
      previousPageUrl: null,
      ...overrides,
    },
  }
}

const page1Items: TestItem[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
]
const page2Items: TestItem[] = [{ id: 3, name: 'Gamma' }]

describe('usePaginatedQuery', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('given a pending fetch, when the hook renders, then data is undefined and loading is true', () => {
    const fetchFn = vi.fn(
      () => new Promise<PaginatedResponse<TestItem>>(() => {})
    )
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: {},
        }),
      { wrapper: makeHookWrapper() }
    )
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
  })

  it('given a successful fetch, when the query resolves, then data and pagination are returned', async () => {
    const response = makePage(page1Items, { totalItems: 2 })
    const fetchFn = vi.fn().mockResolvedValue(response)

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: {},
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(page1Items)
    expect(result.current.pagination?.totalItems).toBe(2)
    expect(result.current.error).toBeNull()
  })

  it('given no initial page, when the hook mounts, then page 1 is fetched', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: {},
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.currentPage).toBe(1)
    expect(fetchFn).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
  })

  it('given an initial page in params, when the hook mounts, then that page is current', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page2Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: { page: 3 },
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.currentPage).toBe(3)
  })

  it('given a loaded query, when the page changes to an explicit number, then the current page updates', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: {},
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.handlePageChange(null, 2)
    })

    expect(result.current.currentPage).toBe(2)
  })

  it('given a pagination URL with a page param, when the page changes, then the page number is taken from the URL', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: {},
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.handlePageChange('https://api.example.com/items?page=4')
    })

    expect(result.current.currentPage).toBe(4)
  })

  it('given a pagination URL without a page param, when the page changes, then page 1 is used', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: { page: 3 },
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.handlePageChange('https://api.example.com/items')
    })

    expect(result.current.currentPage).toBe(1)
  })

  it('given a malformed pagination URL, when the page changes, then page 1 is used and a warning is logged', async () => {
    const { logger } = await import('@/lib/logger')
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: { page: 3 },
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.handlePageChange('not-a-valid-url')
    })

    expect(result.current.currentPage).toBe(1)
    expect(warnSpy).toHaveBeenCalledOnce()
  })

  it('given a loaded page, when the next page is fetching, then the previous data stays visible', async () => {
    let resolveSecondPage: (
      value: PaginatedResponse<TestItem>
    ) => void = () => {}
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(makePage(page1Items))
      .mockImplementationOnce(
        () =>
          new Promise<PaginatedResponse<TestItem>>(resolve => {
            resolveSecondPage = resolve
          })
      )

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: {},
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.handlePageChange(null, 2)
    })

    await waitFor(() => expect(result.current.isFetching).toBe(true))
    expect(result.current.data).toEqual(page1Items)

    act(() => {
      resolveSecondPage(makePage(page2Items))
    })

    await waitFor(() => expect(result.current.data).toEqual(page2Items))
  })

  it('given a null pagination URL, when the page changes, then page 1 is used', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: { page: 5 },
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.handlePageChange(null)
    })

    expect(result.current.currentPage).toBe(1)
  })

  it('given active filters, when filters are updated, then they merge and the page resets to 1', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery<TestItem, FilterParams>({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: { category: 'gi', page: 3 },
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.updateFilters({ category: 'no-gi' })
    })

    expect(result.current.currentPage).toBe(1)
    expect(result.current.params).toMatchObject({ category: 'no-gi', page: 1 })
  })

  it('given active filters, when filters are updated, then a new fetch uses the updated params', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery<TestItem, FilterParams>({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: { category: 'gi' },
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.updateFilters({ category: 'no-gi' })
    })

    await waitFor(() =>
      expect(fetchFn).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'no-gi', page: 1 })
      )
    )
  })

  it('given a failing fetch, when the query settles, then the error is exposed and data is undefined', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: {},
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))
    expect(result.current.error?.message).toBe('Network error')
    expect(result.current.data).toBeUndefined()
  })

  it('given a loaded query, when refetch is called, then the fetch runs again', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: {},
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const callsBefore = fetchFn.mock.calls.length
    await act(async () => {
      await result.current.refetch()
    })

    expect(fetchFn.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('given initial params, when the hook mounts, then the fetch receives them', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: { search: 'bjj', page: 1 },
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(fetchFn).toHaveBeenCalled())

    expect(fetchFn).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'bjj', page: 1 })
    )
  })
})
