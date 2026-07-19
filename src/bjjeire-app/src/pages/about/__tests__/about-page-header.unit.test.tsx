import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AboutPageHeader } from '../about-page-header'
import { AboutPageTestIds } from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'

describe('AboutPageHeader', () => {
  it('given the about page header, when it renders, then the title is a level-1 heading and the subtitle is shown', () => {
    render(<AboutPageHeader />)

    expect(
      screen.getByRole('heading', { level: 1, name: uiContent.about.title })
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(AboutPageTestIds.HEADER_SUBTITLE)
    ).toHaveTextContent(uiContent.about.subtitle)
  })
})
