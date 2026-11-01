import { describe, it, expect } from 'vitest'
import { textMatchesSearch } from '@/utils/search-text'

describe('textMatchesSearch', () => {
  it.each([
    ['GFS Team Lótus BJJ', 'Lotus'],
    ['GFS Team Lótus BJJ', 'lótus'],
    ['Brú Grappling Studio', 'bru'],
    ['Barão Jiu Jitsu Cork', 'BARAO'],
    ['Plain Name', 'plaín'],
  ])('given "%s", when searching "%s", then it matches', (value, term) => {
    expect(textMatchesSearch(value, term)).toBe(true)
  })

  it('given text without the term, when searching, then it does not match', () => {
    expect(textMatchesSearch('Brú Grappling', 'Lotus')).toBe(false)
  })

  it('given a value that is not text, when searching, then it does not match', () => {
    expect(textMatchesSearch(undefined, 'Lotus')).toBe(false)
  })
})
