import type { JSX } from 'react'
import PageLayout from '@/components/layout/page-layout'
import { uiContent } from '@/config/ui-content'
import { AboutMissionSection } from './about/about-mission-section'
import { AboutValuesSection } from './about/about-values-section'
import { AboutContactSection } from './about/about-contact-section'

export default function AboutPage(): JSX.Element {
  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl py-10 sm:py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            {uiContent.about.title}
          </h1>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            {uiContent.about.subtitle}
          </p>
        </header>

        <div className="space-y-6">
          <AboutMissionSection />
          <AboutValuesSection />
          <AboutContactSection />
        </div>
      </div>
    </PageLayout>
  )
}
