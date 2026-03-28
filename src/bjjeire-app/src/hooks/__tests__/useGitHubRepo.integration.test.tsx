import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGitHubRepo } from '../useGitHubRepo'
import { makeHookWrapper } from '@/testing/render-utils'
import { mockFetchSuccess, mockFetchError } from '@/testing/fetch-helpers'

describe('useGitHubRepo', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns undefined stars when no URL is provided', () => {
    const { result } = renderHook(() => useGitHubRepo(undefined), {
      wrapper: makeHookWrapper(),
    })
    expect(result.current.stars).toBeUndefined()
  })

  it('returns undefined stars when the URL has no recognizable repo path', () => {
    const { result } = renderHook(
      () => useGitHubRepo('https://gitlab.com/owner/repo'),
      { wrapper: makeHookWrapper() }
    )
    expect(result.current.stars).toBeUndefined()
  })

  it('does not call fetch when disabled', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderHook(() => useGitHubRepo(undefined), { wrapper: makeHookWrapper() })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches the correct GitHub API URL', async () => {
    mockFetchSuccess({ stargazers_count: 42, forks_count: 5 })

    const { result } = renderHook(
      () => useGitHubRepo('https://github.com/owner/repo'),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.stars).toBeDefined())

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo',
      undefined
    )
  })

  it('returns star count on success', async () => {
    mockFetchSuccess({ stargazers_count: 42, forks_count: 5 })

    const { result } = renderHook(
      () => useGitHubRepo('https://github.com/owner/repo'),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.stars).toBe(42))
  })

  it('returns undefined stars when the API responds with an error status', async () => {
    mockFetchError(500)

    const { result } = renderHook(
      () => useGitHubRepo('https://github.com/owner/repo'),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled())
    expect(result.current.stars).toBeUndefined()
  })

  it('returns undefined stars on a 404 response', async () => {
    mockFetchError(404)

    const { result } = renderHook(
      () => useGitHubRepo('https://github.com/owner/repo'),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled())
    expect(result.current.stars).toBeUndefined()
  })

  it('strips trailing slash from URL before fetching', async () => {
    mockFetchSuccess({ stargazers_count: 7, forks_count: 1 })

    const { result } = renderHook(
      () => useGitHubRepo('https://github.com/owner/repo/'),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.stars).toBe(7))

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo',
      undefined
    )
  })
})
