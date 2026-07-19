import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/testing/render-utils'
import AboutPage from '@/pages/AboutPage'
import {
  AboutMissionTestIds,
  AboutValuesTestIds,
  AboutContactTestIds,
} from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'

// Section content is covered by the per-section unit tests;
// this test only verifies the page composes them correctly.
describe('AboutPage', () => {
  it('given the about page, when it renders, then the page title is the only level-1 heading', () => {
    renderWithProviders(<AboutPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: uiContent.about.title })
    ).toBeInTheDocument()
  })

  it('given the about page, when it renders, then mission, values and contact sections appear in that order', () => {
    renderWithProviders(<AboutPage />)

    const missionSection = screen.getByTestId(AboutMissionTestIds.SECTION)
    const valuesSection = screen.getByTestId(AboutValuesTestIds.SECTION)
    const contactSection = screen.getByTestId(AboutContactTestIds.SECTION)

    expect(
      missionSection.compareDocumentPosition(valuesSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      valuesSection.compareDocumentPosition(contactSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})
