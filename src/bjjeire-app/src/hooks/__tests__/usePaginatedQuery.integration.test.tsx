import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePaginatedQuery } from '../usePaginatedQuery'
import { makeHookWrapper } from '@/testing/render-utils'
import type { PaginatedResponse } from '@/types/common'

interface TestItem {
  id: number
  name: string
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

  it('returns undefined data while loading', () => {
    const fetchFn = vi.fn(() => new Promise<PaginatedResponse<TestItem>>(() => {}))
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

  it('returns data and pagination on success', async () => {
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

  it('starts at page 1 by default', async () => {
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

  it('respects initialParams.page', async () => {
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

  it('handlePageChange with explicit page number updates currentPage', async () => {
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

  it('handlePageChange extracts page number from URL query string', async () => {
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

  it('handlePageChange falls back to page 1 when URL has no page param', async () => {
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

  it('handlePageChange falls back to page 1 when URL is null', async () => {
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

  it('updateFilters merges new filters and resets to page 1', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: { category: 'gi', page: 3 } as { category: string; page?: number },
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

  it('updateFilters triggers a new fetch with updated params', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: { category: 'gi' } as { category: string; page?: number },
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

  it('exposes error when fetchFn rejects', async () => {
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

  it('refetch re-calls fetchFn', async () => {
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

  it('passes initialParams to fetchFn', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makePage(page1Items))

    renderHook(
      () =>
        usePaginatedQuery({
          queryKeyBase: ['test'],
          fetchFn,
          initialParams: { search: 'bjj', page: 1 } as { search: string; page?: number },
        }),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(fetchFn).toHaveBeenCalled())

    expect(fetchFn).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'bjj', page: 1 })
    )
  })
})
