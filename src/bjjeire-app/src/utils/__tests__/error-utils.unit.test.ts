import { describe, it, expect } from 'vitest'
import { formatFetchError } from '../error-utils'

const DEFAULT_MSG = 'An unexpected error occurred. Please try again.'
const NETWORK_MSG =
  'Could not connect to the server. Please check your internet connection and try again.'

describe('formatFetchError', () => {
  it('returns default message for null', () => {
    expect(formatFetchError(null)).toBe(DEFAULT_MSG)
  })

  it('returns default message for undefined', () => {
    expect(formatFetchError(undefined)).toBe(DEFAULT_MSG)
  })

  it('returns the Error message for a generic Error', () => {
    expect(formatFetchError(new Error('Something broke'))).toBe(
      'Something broke'
    )
  })

  it('returns network message for "failed to fetch" errors', () => {
    expect(formatFetchError(new Error('Failed to fetch'))).toBe(NETWORK_MSG)
  })

  it('returns network message for NetworkError in message', () => {
    expect(
      formatFetchError(new Error('NetworkError when attempting to fetch'))
    ).toBe(NETWORK_MSG)
  })

  it('returns network message for TypeError instances', () => {
    const err = new TypeError('Load failed')
    expect(formatFetchError(err)).toBe(NETWORK_MSG)
  })

  it('returns the string directly for string errors', () => {
    expect(formatFetchError('custom error string')).toBe('custom error string')
  })

  it('returns default message for unknown object types', () => {
    expect(formatFetchError({ code: 500 })).toBe(DEFAULT_MSG)
  })

  it('returns default message for a number', () => {
    expect(formatFetchError(404)).toBe(DEFAULT_MSG)
  })
})
