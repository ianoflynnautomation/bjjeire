import { describe, it, expect } from 'vitest'
import { ensureExternalUrlScheme, formatDisplayUrl } from '../formattingUtils'

describe('ensureExternalUrlScheme', () => {
  it('leaves https URLs unchanged', () => {
    expect(ensureExternalUrlScheme('https://example.com')).toBe(
      'https://example.com'
    )
  })

  it('leaves http URLs unchanged', () => {
    expect(ensureExternalUrlScheme('http://example.com')).toBe(
      'http://example.com'
    )
  })

  it('prepends https:// to bare domains', () => {
    expect(ensureExternalUrlScheme('example.com')).toBe('https://example.com')
  })

  it('returns undefined for empty string', () => {
    expect(ensureExternalUrlScheme('')).toBeUndefined()
  })

  it('returns undefined for whitespace-only string', () => {
    expect(ensureExternalUrlScheme('   ')).toBeUndefined()
  })

  it('returns undefined for undefined input', () => {
    expect(ensureExternalUrlScheme(undefined)).toBeUndefined()
  })

  it('is case-insensitive for the scheme check', () => {
    expect(ensureExternalUrlScheme('HTTP://example.com')).toBe(
      'HTTP://example.com'
    )
  })
})

describe('formatDisplayUrl', () => {
  it('strips www and trailing slash from a full URL', () => {
    expect(formatDisplayUrl('https://www.example.com/')).toBe('example.com')
  })

  it('preserves path while stripping trailing slash', () => {
    expect(formatDisplayUrl('https://www.example.com/path/page/')).toBe(
      'example.com/path/page'
    )
  })

  it('handles URL without www', () => {
    expect(formatDisplayUrl('https://example.com/about')).toBe(
      'example.com/about'
    )
  })

  it('handles bare domain (no scheme)', () => {
    expect(formatDisplayUrl('example.com')).toBe('example.com')
  })

  it('returns undefined for undefined input', () => {
    expect(formatDisplayUrl(undefined)).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(formatDisplayUrl('')).toBeUndefined()
  })
})
