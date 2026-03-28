import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { AboutSection } from './about-section'

export function AboutMissionSection(): JSX.Element {
  return (
    <AboutSection
      id="about-mission"
      headingId="about-mission-heading"
      title={uiContent.about.missionTitle}
    >
      <div className="space-y-4 leading-relaxed text-slate-700 dark:text-slate-300">
        <p>{uiContent.about.missionParagraph1}</p>
        <p>{uiContent.about.missionParagraph2}</p>
      </div>
    </AboutSection>
  )
}
