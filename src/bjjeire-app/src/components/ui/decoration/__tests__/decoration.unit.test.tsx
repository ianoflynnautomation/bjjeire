import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TricolorEdge } from '../tricolor-edge'
import { GlowField } from '../glow-field'

describe('decoration primitives', () => {
  it('given a TricolorEdge, when rendered, then it is decorative (aria-hidden) and merges a caller className', () => {
    const { container } = render(<TricolorEdge className="custom-edge" />)
    const el = container.firstChild as HTMLElement

    expect(el).toHaveAttribute('aria-hidden', 'true')
    expect(el).toHaveClass('custom-edge')
  })

  it('given a GlowField, when rendered, then it is decorative (aria-hidden) and renders its blur blooms', () => {
    const { container } = render(<GlowField />)
    const el = container.firstChild as HTMLElement

    expect(el).toHaveAttribute('aria-hidden', 'true')
    expect(el.querySelectorAll('div')).toHaveLength(2)
  })
})
