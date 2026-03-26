import { describe, it, expect } from 'vitest'
import { parseRepoPath } from '../useGitHubRepo'

describe('parseRepoPath', () => {
  it.each([
    ['https://github.com/owner/repo', 'owner/repo'],
    ['https://github.com/owner/repo/', 'owner/repo'],
    ['https://github.com/owner/repo?tab=readme', 'owner/repo'],
    ['https://github.com/owner/repo#readme', 'owner/repo'],
    ['http://github.com/owner/repo', 'owner/repo'],
    ['github.com/owner/repo', 'owner/repo'],
  ])('extracts repo path from "%s"', (url, expected) => {
    expect(parseRepoPath(url)).toBe(expected)
  })

  it.each([
    [''],
    ['https://gitlab.com/owner/repo'],
    ['not-a-url'],
    ['https://github.com/owner'],
  ])('returns undefined for "%s"', (url) => {
    expect(parseRepoPath(url)).toBeUndefined()
  })
})
