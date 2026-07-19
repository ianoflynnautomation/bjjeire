import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AboutValuesSection } from '../about-values-section'
import { AboutValuesTestIds } from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'

describe('AboutValuesSection', () => {
  it('given the values section, when it renders, then the principles title and every principle are shown as a list', () => {
    render(<AboutValuesSection />)

    expect(
      screen.getByRole('heading', { name: uiContent.about.principlesTitle })
    ).toBeInTheDocument()

    const list = screen.getByTestId(AboutValuesTestIds.LIST)
    expect(list.tagName).toBe('UL')

    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(uiContent.about.principles.length)
    uiContent.about.principles.forEach((principle, i) => {
      expect(items[i]).toHaveTextContent(principle)
    })
  })
})
