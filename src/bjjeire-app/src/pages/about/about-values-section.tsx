import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { AboutSection } from './about-section'

export function AboutValuesSection(): JSX.Element {
  return (
    <AboutSection
      id="about-values"
      headingId="about-values-heading"
      title={uiContent.about.principlesTitle}
    >
      <ul className="list-disc space-y-2 pl-6 text-slate-700 marker:text-emerald-500 dark:text-slate-300 dark:marker:text-emerald-400">
        {uiContent.about.principles.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </AboutSection>
  )
}
