import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AboutValuesSection } from '../about-values-section'
import { AboutValuesTestIds } from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'

describe('AboutValuesSection', () => {
  it('renders the section with the correct test ID', () => {
    render(<AboutValuesSection />)

    expect(screen.getByTestId(AboutValuesTestIds.SECTION)).toBeInTheDocument()
  })

  it('renders the principles title as a heading', () => {
    render(<AboutValuesSection />)

    expect(
      screen.getByRole('heading', { name: uiContent.about.principlesTitle })
    ).toBeInTheDocument()
  })

  it('renders all principle items as list items', () => {
    render(<AboutValuesSection />)

    const list = screen.getByTestId(AboutValuesTestIds.LIST)
    const items = within(list).getAllByRole('listitem')

    expect(items).toHaveLength(uiContent.about.principles.length)
    uiContent.about.principles.forEach((principle, i) => {
      expect(items[i]).toHaveTextContent(principle)
    })
  })

  it('renders as a <ul> list', () => {
    render(<AboutValuesSection />)

    const list = screen.getByTestId(AboutValuesTestIds.LIST)
    expect(list.tagName).toBe('UL')
  })
})
