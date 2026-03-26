import { describe, it, expect, vi } from 'vitest'
import { fetchJson, FetchError } from '../fetch-client'
import {
  mockFetchSuccess,
  mockFetchError,
  mockFetchErrorWithMessage,
} from '@/testing/fetch-helpers'

describe('fetchJson', () => {
  it('returns parsed JSON on a 200 response', async () => {
    mockFetchSuccess({ value: 42 })
    const result = await fetchJson<{ value: number }>('https://example.com/api')
    expect(result).toEqual({ value: 42 })
  })

  it('passes the URL to fetch', async () => {
    mockFetchSuccess({})
    await fetchJson('https://example.com/api/items')
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      'https://example.com/api/items',
      undefined
    )
  })

  it('forwards options to fetch', async () => {
    mockFetchSuccess({})
    const options: RequestInit = { headers: { Authorization: 'Bearer token' } }
    await fetchJson('https://example.com/api', options)
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      'https://example.com/api',
      options
    )
  })

  it.each([400, 401, 403, 404, 500, 503])(
    'throws FetchError for status %i',
    async (status) => {
      mockFetchError(status)
      await expect(fetchJson('https://example.com/api')).rejects.toThrow(
        FetchError
      )
    }
  )

  it('includes the status code in the thrown FetchError', async () => {
    mockFetchError(404)
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect(error).toBeInstanceOf(FetchError)
    expect((error as FetchError).status).toBe(404)
  })

  it('includes the URL in the thrown FetchError', async () => {
    mockFetchError(500)
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect((error as FetchError).url).toBe('https://example.com/api')
  })

  it('sets the error name to FetchError', async () => {
    mockFetchError(503)
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect((error as FetchError).name).toBe('FetchError')
  })

  it('uses the message field from a JSON error body', async () => {
    mockFetchErrorWithMessage(404, 'Not Found')
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect((error as FetchError).message).toBe('Not Found')
  })

  it('falls back to the default message when the error body has no message field', async () => {
    mockFetchErrorWithMessage(422, '')
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect((error as FetchError).message).toBe('Request failed with status 422')
  })

  it('falls back to the default message when the error body is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 })
    )
    const error = await fetchJson('https://example.com/api').catch(
      (e: unknown) => e
    )
    expect((error as FetchError).message).toBe('Request failed with status 500')
  })
})
