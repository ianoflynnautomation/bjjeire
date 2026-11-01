import { describe, it, expect } from 'vitest'
import { formatFetchError } from '../error-utils'

const DEFAULT_MSG = 'An unexpected error occurred. Please try again.'
const SERVER_MSG =
  'Something went wrong on our side. Please try again in a moment.'
const NETWORK_MSG =
  'Could not connect to the server. Please check your internet connection and try again.'

describe('formatFetchError', () => {
  it('given a null error, when it is formatted, then the default message is returned', () => {
    expect(formatFetchError(null)).toBe(DEFAULT_MSG)
  })

  it('given an undefined error, when it is formatted, then the default message is returned', () => {
    expect(formatFetchError(undefined)).toBe(DEFAULT_MSG)
  })

  it('given a generic Error, when it is formatted, then its technical message is hidden', () => {
    expect(formatFetchError(new Error('Something broke'))).toBe(SERVER_MSG)
  })

  it('given a "failed to fetch" error, when it is formatted, then the network message is returned', () => {
    expect(formatFetchError(new Error('Failed to fetch'))).toBe(NETWORK_MSG)
  })

  it('given a NetworkError, when it is formatted, then the network message is returned', () => {
    expect(
      formatFetchError(new Error('NetworkError when attempting to fetch'))
    ).toBe(NETWORK_MSG)
  })

  it('given a Safari "Load failed" error, when it is formatted, then the network message is returned', () => {
    const err = new TypeError('Load failed')
    expect(formatFetchError(err)).toBe(NETWORK_MSG)
  })

  it('given a TypeError unrelated to fetch, when it is formatted, then its technical message is hidden', () => {
    const err = new TypeError(
      "Cannot read properties of undefined (reading 'name')"
    )
    expect(formatFetchError(err)).toBe(SERVER_MSG)
  })

  it('given an axios ERR_NETWORK error, when it is formatted, then the network message is returned', () => {
    const err = Object.assign(new Error('Network Error'), {
      name: 'AxiosError',
      code: 'ERR_NETWORK',
    })
    expect(formatFetchError(err)).toBe(NETWORK_MSG)
  })

  it('given an axios HTTP error, when it is formatted, then plain advice is returned instead of the status', () => {
    const err = Object.assign(
      new Error('Request failed with status code 500'),
      { name: 'AxiosError', code: 'ERR_BAD_RESPONSE' }
    )
    expect(formatFetchError(err)).toBe(SERVER_MSG)
  })

  it('given a string error, when it is formatted, then the string itself is returned', () => {
    expect(formatFetchError('custom error string')).toBe('custom error string')
  })

  it('given an unknown object, when it is formatted, then the default message is returned', () => {
    expect(formatFetchError({ code: 500 })).toBe(DEFAULT_MSG)
  })

  it('given a number, when it is formatted, then the default message is returned', () => {
    expect(formatFetchError(404)).toBe(DEFAULT_MSG)
  })
})
