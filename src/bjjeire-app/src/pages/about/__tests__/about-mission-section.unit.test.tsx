import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AboutMissionSection } from '../about-mission-section'
import { AboutMissionTestIds } from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'

describe('AboutMissionSection', () => {
  it('given the mission section, when it renders, then the mission title and both paragraphs are shown', () => {
    render(<AboutMissionSection />)

    expect(
      screen.getByRole('heading', { name: uiContent.about.missionTitle })
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(AboutMissionTestIds.PARAGRAPH_TEXT_1)
    ).toHaveTextContent(uiContent.about.missionParagraph1)
    expect(
      screen.getByTestId(AboutMissionTestIds.PARAGRAPH_TEXT_2)
    ).toHaveTextContent(uiContent.about.missionParagraph2)
  })

  it('given the mission section, when assistive technology reads it, then the section is labelled by its heading', () => {
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
