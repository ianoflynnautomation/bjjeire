import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = 'Site title'
  })

  it('given a title, when the hook renders, then the document title is set', () => {
    renderHook(() => {
      useDocumentTitle('Page title')
    })

    expect(document.title).toBe('Page title')
  })

  it('given a new title, when the hook rerenders, then the document title updates', () => {
    const { rerender } = renderHook(
      ({ title }) => {
        useDocumentTitle(title)
      },
      { initialProps: { title: 'First' } }
    )

    rerender({ title: 'Second' })

    expect(document.title).toBe('Second')
  })
})
