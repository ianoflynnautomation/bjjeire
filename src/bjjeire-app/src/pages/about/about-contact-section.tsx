import type { JSX } from 'react'
import { SocialMediaLinks } from '@/components/ui/social-media/social-media-links'
import { uiContent } from '@/config/ui-content'
import { env } from '@/config/env'
import { AboutSection } from './about-section'
import { AboutContactTestIds } from '@/constants/aboutDataTestIds'

const socialMedia = {
  instagram: env.SOCIAL_INSTAGRAM_URL || undefined,
  x: env.SOCIAL_INSTAGRAM_URL || undefined,
}

export function AboutContactSection(): JSX.Element {
  return (
    <AboutSection
      id="about-contact"
      headingId="about-contact-heading"
      title={uiContent.about.contactTitle}
      data-testid={AboutContactTestIds.SECTION}
    >
      <p
        className="text-slate-700 dark:text-slate-300"
        data-testid={AboutContactTestIds.PARAGRAPH_TEXT}
      >
        {uiContent.about.contactPrefix}{' '}
        <a
          href={`mailto:${env.CONTACT_EMAIL}`}
          aria-label={`Send an email to ${env.CONTACT_EMAIL}`}
          className="font-medium text-emerald-600 transition-colors hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
          data-testid={AboutContactTestIds.EMAIL_LINK}
        >
          {env.CONTACT_EMAIL}
        </a>
        .
      </p>
      <div className="mt-4">
        <SocialMediaLinks
          socialMedia={socialMedia}
          data-testid={AboutContactTestIds.SOCIAL_LINKS}
        />
      </div>
    </AboutSection>
  )
}
