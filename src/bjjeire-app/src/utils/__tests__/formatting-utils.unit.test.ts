import { describe, it, expect } from 'vitest'
import { ensureExternalUrlScheme, formatDisplayUrl } from '../formatting-utils'

describe('ensureExternalUrlScheme', () => {
  it('given an https URL, when the scheme is ensured, then the URL is unchanged', () => {
    expect(ensureExternalUrlScheme('https://example.com')).toBe(
      'https://example.com'
    )
  })

  it('given an http URL, when the scheme is ensured, then the URL is unchanged', () => {
    expect(ensureExternalUrlScheme('http://example.com')).toBe(
      'http://example.com'
    )
  })

  it('given a bare domain, when the scheme is ensured, then https:// is prepended', () => {
    expect(ensureExternalUrlScheme('example.com')).toBe('https://example.com')
  })

  it('given an empty string, when the scheme is ensured, then undefined is returned', () => {
    expect(ensureExternalUrlScheme('')).toBeUndefined()
  })

  it('given a whitespace-only string, when the scheme is ensured, then undefined is returned', () => {
    expect(ensureExternalUrlScheme('   ')).toBeUndefined()
  })

  it('given undefined input, when the scheme is ensured, then undefined is returned', () => {
    expect(ensureExternalUrlScheme(undefined)).toBeUndefined()
  })

  it('given a mixed-case scheme, when the scheme is ensured, then it is recognised case-insensitively', () => {
    expect(ensureExternalUrlScheme('HTTP://example.com')).toBe(
      'HTTP://example.com'
    )
  })
})

describe('formatDisplayUrl', () => {
  it('given a full URL, when it is formatted for display, then www and the trailing slash are stripped', () => {
    expect(formatDisplayUrl('https://www.example.com/')).toBe('example.com')
  })

  it('given a URL with a path, when it is formatted for display, then the path is kept and the trailing slash stripped', () => {
    expect(formatDisplayUrl('https://www.example.com/path/page/')).toBe(
      'example.com/path/page'
    )
  })

  it('given a URL without www, when it is formatted for display, then the hostname is returned as-is', () => {
    expect(formatDisplayUrl('https://example.com/about')).toBe(
      'example.com/about'
    )
  })

  it('given a bare domain, when it is formatted for display, then the domain is returned', () => {
    expect(formatDisplayUrl('example.com')).toBe('example.com')
  })

  it('given undefined input, when it is formatted for display, then undefined is returned', () => {
    expect(formatDisplayUrl(undefined)).toBeUndefined()
  })

  it('given an empty string, when it is formatted for display, then undefined is returned', () => {
    expect(formatDisplayUrl('')).toBeUndefined()
  })
})
