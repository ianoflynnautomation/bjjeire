import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/cn'

describe('cn', () => {
  it('given multiple class strings, when they are merged, then they are joined with spaces', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('given falsy conditional values, when classes are merged, then the falsy entries are dropped', () => {
    const isHidden = false as boolean
    expect(cn('base', isHidden && 'hidden', undefined, null, 'end')).toBe(
      'base end'
    )
  })

  it('given conflicting Tailwind classes, when they are merged, then the last one wins', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4')
  })

  it('given object and array syntax, when classes are merged, then truthy entries are included', () => {
    expect(cn(['a', { b: true, c: false }])).toBe('a b')
  })
})
