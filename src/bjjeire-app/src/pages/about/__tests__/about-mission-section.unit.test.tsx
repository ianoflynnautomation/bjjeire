import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AboutMissionSection } from '../about-mission-section'
import { AboutMissionTestIds } from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'

describe('AboutMissionSection', () => {
  it('renders the section with the correct test ID', () => {
    render(<AboutMissionSection />)

    expect(screen.getByTestId(AboutMissionTestIds.SECTION)).toBeInTheDocument()
  })

  it('renders the mission title as a heading', () => {
    render(<AboutMissionSection />)

    expect(
      screen.getByRole('heading', { name: uiContent.about.missionTitle })
    ).toBeInTheDocument()
  })

  it('renders both mission paragraphs', () => {
    render(<AboutMissionSection />)

    expect(
      screen.getByTestId(AboutMissionTestIds.PARAGRAPH_TEXT_1)
    ).toHaveTextContent(uiContent.about.missionParagraph1)
    expect(
      screen.getByTestId(AboutMissionTestIds.PARAGRAPH_TEXT_2)
    ).toHaveTextContent(uiContent.about.missionParagraph2)
  })

  it('uses aria-labelledby to associate heading with section', () => {
    render(<AboutMissionSection />)

    const section = screen.getByTestId(AboutMissionTestIds.SECTION)
    const labelledBy = section.getAttribute('aria-labelledby')
    expect(labelledBy).toBe('about-mission-heading')

    const heading = screen.getByRole('heading', {
      name: uiContent.about.missionTitle,
    })
    expect(heading.id).toBe(labelledBy)
  })
})
