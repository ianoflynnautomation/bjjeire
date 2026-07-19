import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseRepoPath, useGitHubRepo } from '../useGitHubRepo'
import { makeHookWrapper } from '@/testing/render-utils'

function mockFetchSuccess(data: object): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(data), { status: 200 })
  )
}

function mockFetchError(status: number): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(null, { status })
  )
}

describe('parseRepoPath', () => {
  it.each([
    ['https://github.com/owner/repo', 'owner/repo'],
    ['https://github.com/owner/repo/', 'owner/repo'],
    ['https://github.com/owner/repo?tab=readme', 'owner/repo'],
    ['https://github.com/owner/repo#readme', 'owner/repo'],
    ['http://github.com/owner/repo', 'owner/repo'],
    ['github.com/owner/repo', 'owner/repo'],
  ])(
    'given the URL "%s", when it is parsed, then the repo path is extracted',
    (url, expected) => {
      expect(parseRepoPath(url)).toBe(expected)
    }
  )

  it.each([
    [''],
    ['https://gitlab.com/owner/repo'],
    ['not-a-url'],
    ['https://github.com/owner'],
  ])(
    'given the non-repo URL "%s", when it is parsed, then undefined is returned',
    url => {
      expect(parseRepoPath(url)).toBeUndefined()
    }
  )
})

describe('useGitHubRepo', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('given no URL, when the hook renders, then stars are undefined', () => {
    const { result } = renderHook(() => useGitHubRepo(undefined), {
      wrapper: makeHookWrapper(),
    })
    expect(result.current.stars).toBeUndefined()
  })

  it('given a non-GitHub URL, when the hook renders, then stars are undefined', () => {
    const { result } = renderHook(
      () => useGitHubRepo('https://gitlab.com/owner/repo'),
      { wrapper: makeHookWrapper() }
    )
    expect(result.current.stars).toBeUndefined()
  })

  it('given no URL, when the hook renders, then no network request is made', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderHook(() => useGitHubRepo(undefined), { wrapper: makeHookWrapper() })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('given a GitHub repo URL, when the hook fetches, then the GitHub API is called for that repo', async () => {
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

  it('given the API returns repo data, when the fetch resolves, then the star count is returned', async () => {
    mockFetchSuccess({ stargazers_count: 42, forks_count: 5 })

    const { result } = renderHook(
      () => useGitHubRepo('https://github.com/owner/repo'),
      { wrapper: makeHookWrapper() }
    )

    await waitFor(() => expect(result.current.stars).toBe(42))
  })

  it.each([[500], [404]])(
    'given the API responds with status %i, when the fetch resolves, then stars are undefined',
    async status => {
      mockFetchError(status)

      const { result } = renderHook(
        () => useGitHubRepo('https://github.com/owner/repo'),
        { wrapper: makeHookWrapper() }
      )

      await waitFor(() =>
        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled()
      )
      expect(result.current.stars).toBeUndefined()
    }
  )
})
