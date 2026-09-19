import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TricolorEdge } from '../tricolor-edge'

describe('decoration primitives', () => {
  it('given a TricolorEdge, when rendered, then it is decorative (aria-hidden) and merges a caller className', () => {
    const { container } = render(<TricolorEdge className="custom-edge" />)
    const el = container.firstChild as HTMLElement

    expect(el).toHaveAttribute('aria-hidden', 'true')
    expect(el).toHaveClass('custom-edge')
  })
})
