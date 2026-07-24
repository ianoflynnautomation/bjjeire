import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { AboutSection } from './about-section'
import { AboutMissionTestIds } from '@/constants/aboutDataTestIds'

export const AboutMissionSection = function AboutMissionSection(): JSX.Element {
    return (
      <AboutSection
        id="about-mission"
        headingId="about-mission-heading"
        title={uiContent.about.missionTitle}
        data-testid={AboutMissionTestIds.SECTION}
      >
        <div className="space-y-4 leading-relaxed text-fg-muted">
          <p data-testid={AboutMissionTestIds.PARAGRAPH_TEXT_1}>
            {uiContent.about.missionParagraph1}
          </p>
          <p data-testid={AboutMissionTestIds.PARAGRAPH_TEXT_2}>
            {uiContent.about.missionParagraph2}
          </p>
        </div>
      </AboutSection>
    )
  }
