import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { AboutPageTestIds } from '@/constants/aboutDataTestIds'

export const AboutPageHeader = function AboutPageHeader(): JSX.Element {
  return (
    <header className="mb-10 text-center" data-testid={AboutPageTestIds.HEADER}>
      <h1
        className="display-expanded text-4xl font-black text-fg sm:text-5xl"
        data-testid={AboutPageTestIds.HEADER_TITLE}
      >
        {uiContent.about.title}
      </h1>
      <p
        className="mt-4 text-lg text-fg-subtle"
        data-testid={AboutPageTestIds.HEADER_SUBTITLE}
      >
        {uiContent.about.subtitle}
      </p>
    </header>
  )
}
