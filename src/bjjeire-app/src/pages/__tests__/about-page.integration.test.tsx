import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/testing/render-utils'
import AboutPage from '@/pages/AboutPage'
import {
  AboutPageTestIds,
  AboutMissionTestIds,
  AboutValuesTestIds,
  AboutContactTestIds,
} from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'
import { env } from '@/config/env'

function renderAboutPage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(<AboutPage />)
}

describe('AboutPage Integration', () => {
  it('renders the page root container', () => {
    renderAboutPage()

    expect(screen.getByTestId(AboutPageTestIds.ROOT)).toBeInTheDocument()
  })

  it('renders the page header with title and subtitle', () => {
    renderAboutPage()

    expect(
      screen.getByRole('heading', { level: 1, name: uiContent.about.title })
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(AboutPageTestIds.HEADER_SUBTITLE)
    ).toHaveTextContent(uiContent.about.subtitle)
  })

  it('renders the mission section with both paragraphs', () => {
    renderAboutPage()

    expect(screen.getByTestId(AboutMissionTestIds.SECTION)).toBeInTheDocument()
    expect(
      screen.getByTestId(AboutMissionTestIds.PARAGRAPH_TEXT_1)
    ).toHaveTextContent(uiContent.about.missionParagraph1)
    expect(
      screen.getByTestId(AboutMissionTestIds.PARAGRAPH_TEXT_2)
    ).toHaveTextContent(uiContent.about.missionParagraph2)
  })

  it('renders the values section with all principles', () => {
    renderAboutPage()

    expect(screen.getByTestId(AboutValuesTestIds.SECTION)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: uiContent.about.principlesTitle })
    ).toBeInTheDocument()

    uiContent.about.principles.forEach(principle => {
      expect(screen.getByText(principle)).toBeInTheDocument()
    })
  })

  it('renders the contact section with email link', () => {
    renderAboutPage()

    expect(screen.getByTestId(AboutContactTestIds.SECTION)).toBeInTheDocument()

    const emailLink = screen.getByTestId(AboutContactTestIds.EMAIL_LINK)
    expect(emailLink).toHaveAttribute('href', `mailto:${env.CONTACT_EMAIL}`)
  })

  it('renders all three sections in the correct order', () => {
    renderAboutPage()

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
