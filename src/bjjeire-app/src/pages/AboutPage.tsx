import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import PageLayout from '@/components/layout/page-layout'
import { AboutPageHeader } from './about/about-page-header'
import { AboutMissionSection } from './about/about-mission-section'
import { AboutValuesSection } from './about/about-values-section'
import { AboutContactSection } from './about/about-contact-section'
import { AboutPageTestIds } from '@/constants/aboutDataTestIds'

export default function AboutPage(): JSX.Element {
  useDocumentTitle(uiContent.about.documentTitle)

  return (
    <PageLayout>
      <div
        className="mx-auto max-w-4xl py-10 sm:py-12"
        data-testid={AboutPageTestIds.ROOT}
      >
        <AboutPageHeader />

        <div className="space-y-6">
          <AboutMissionSection />
          <AboutValuesSection />
          <AboutContactSection />
        </div>
      </div>
    </PageLayout>
  )
}
