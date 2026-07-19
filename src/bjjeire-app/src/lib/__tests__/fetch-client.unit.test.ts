import { describe, it, expect, vi } from 'vitest'
import { fetchJson, FetchError } from '../fetch-client'

function mockFetchSuccess(data: object, status = 200): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(data), { status })
  )
}

function mockFetchError(status: number): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(null, { status })
  )
}

function mockFetchErrorWithMessage(status: number, message: string): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify({ message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

describe('fetchJson', () => {
  it('given a 200 response, when JSON is fetched, then the parsed body is returned', async () => {
    mockFetchSuccess({ value: 42 })
    const result = await fetchJson<{ value: number }>('https://example.com/api')
    expect(result).toEqual({ value: 42 })
  })

  it('given a URL, when JSON is fetched, then fetch is called with that URL', async () => {
    mockFetchSuccess({})
    await fetchJson('https://example.com/api/items')
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      'https://example.com/api/items',
      undefined
    )
  })

  it('given request options, when JSON is fetched, then the options are forwarded to fetch', async () => {
    mockFetchSuccess({})
    const options: RequestInit = { headers: { Authorization: 'Bearer token' } }
    await fetchJson('https://example.com/api', options)
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      'https://example.com/api',
      options
    )
  })

  it.each([400, 401, 403, 404, 500, 503])(
    'given a %i response, when JSON is fetched, then a FetchError is thrown',
    async status => {
      mockFetchError(status)
      await expect(fetchJson('https://example.com/api')).rejects.toThrow(
        FetchError
      )
    }
  )

  it('given an error response, when the FetchError is thrown, then it carries the status code', async () => {
    mockFetchError(404)
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect(error).toBeInstanceOf(FetchError)
    expect((error as FetchError).status).toBe(404)
  })

  it('given an error response, when the FetchError is thrown, then it carries the request URL', async () => {
    mockFetchError(500)
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect((error as FetchError).url).toBe('https://example.com/api')
  })

  it('given an error response, when the FetchError is thrown, then its name is FetchError', async () => {
    mockFetchError(503)
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect((error as FetchError).name).toBe('FetchError')
  })

  it('given a JSON error body with a message, when the FetchError is thrown, then that message is used', async () => {
    mockFetchErrorWithMessage(404, 'Not Found')
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect((error as FetchError).message).toBe('Not Found')
  })

  it('given a JSON error body without a message, when the FetchError is thrown, then the default message is used', async () => {
    mockFetchErrorWithMessage(422, '')
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect((error as FetchError).message).toBe('Request failed with status 422')
  })

  it('given a non-JSON error body, when the FetchError is thrown, then the default message is used', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 })
    )
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect((error as FetchError).message).toBe('Request failed with status 500')
  })

  it('given an error response, when the FetchError is thrown, then the failure is logged with URL and status', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetchError(404)
    await fetchJson('https://example.com/api').catch(() => {})
    expect(consoleSpy).toHaveBeenCalledWith(
      '[bjjeire] Fetch error:',
      expect.objectContaining({ url: 'https://example.com/api', status: 404 })
    )
  })

  it('given a network-level failure, when the fetch rejects, then the error is logged and re-thrown', async () => {
    const networkError = new TypeError('Failed to fetch')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(networkError)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const caught = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )

    expect(caught).toBe(networkError)
    expect(consoleSpy).toHaveBeenCalledWith(
      '[bjjeire] Network error — request could not be sent:',
      expect.objectContaining({
        url: 'https://example.com/api',
        cause: networkError,
      })
    )
  })
})
