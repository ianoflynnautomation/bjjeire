import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AboutPageHeader } from '../about-page-header'
import { AboutPageTestIds } from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'

describe('AboutPageHeader', () => {
  it('renders the title', () => {
    render(<AboutPageHeader />)

    expect(screen.getByTestId(AboutPageTestIds.HEADER_TITLE)).toHaveTextContent(
      uiContent.about.title
    )
  })

  it('renders the subtitle', () => {
    render(<AboutPageHeader />)

    expect(
      screen.getByTestId(AboutPageTestIds.HEADER_SUBTITLE)
    ).toHaveTextContent(uiContent.about.subtitle)
  })

  it('renders the title as an h1 heading', () => {
    render(<AboutPageHeader />)

    expect(
      screen.getByRole('heading', { level: 1, name: uiContent.about.title })
    ).toBeInTheDocument()
  })

  it('applies the header test ID to the root element', () => {
    render(<AboutPageHeader />)

    expect(screen.getByTestId(AboutPageTestIds.HEADER)).toBeInTheDocument()
  })
})
