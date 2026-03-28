import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { AboutPageTestIds } from '@/constants/aboutDataTestIds'

export function AboutPageHeader(): JSX.Element {
  return (
    <header className="mb-10 text-center" data-testid={AboutPageTestIds.HEADER}>
      <h1
        className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white"
        data-testid={AboutPageTestIds.HEADER_TITLE}
      >
        {uiContent.about.title}
      </h1>
      <p
        className="mt-4 text-lg text-slate-500 dark:text-slate-400"
        data-testid={AboutPageTestIds.HEADER_SUBTITLE}
      >
        {uiContent.about.subtitle}
      </p>
    </header>
  )
}
