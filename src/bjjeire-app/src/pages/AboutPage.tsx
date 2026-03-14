import { type ReactElement } from 'react'
import PageLayout from '@/components/layout/page-layout'
import { SocialMediaLinks } from '@/components/ui/social-media/social-media-links'
import { uiContent } from '@/config/ui-content'
import { env } from '@/config/env'

const socialMedia = {
  instagram: env.SOCIAL_INSTAGRAM_URL || undefined,
  facebook: env.SOCIAL_FACEBOOK_URL || undefined,
}

export default function AboutPage(): ReactElement {
  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl py-10 sm:py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            {uiContent.about.title}
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            {uiContent.about.subtitle}
          </p>
        </header>

        <div className="space-y-6">
          <section
            aria-labelledby="about-mission-heading"
            className="relative overflow-hidden rounded-3xl bg-slate-800/40 p-6 backdrop-blur-sm ring-1 ring-white/8"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-emerald-500 via-white/30 to-orange-500"
              aria-hidden="true"
            />
            <h2
              id="about-mission-heading"
              className="mb-4 text-2xl font-bold text-white"
            >
              {uiContent.about.missionTitle}
            </h2>
            <div className="space-y-4 leading-relaxed text-slate-300">
              <p>{uiContent.about.missionParagraph1}</p>
              <p>{uiContent.about.missionParagraph2}</p>
            </div>
          </section>

          <section
            aria-labelledby="about-values-heading"
            className="relative overflow-hidden rounded-3xl bg-slate-800/40 p-6 backdrop-blur-sm ring-1 ring-white/8"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-emerald-500 via-white/30 to-orange-500"
              aria-hidden="true"
            />
            <h2
              id="about-values-heading"
              className="mb-4 text-2xl font-bold text-white"
            >
              {uiContent.about.principlesTitle}
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-slate-300 marker:text-emerald-400">
              {uiContent.about.principles.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="about-contact-heading"
            className="relative overflow-hidden rounded-3xl bg-slate-800/40 p-6 backdrop-blur-sm ring-1 ring-white/8"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-emerald-500 via-white/30 to-orange-500"
              aria-hidden="true"
            />
            <h2
              id="about-contact-heading"
              className="mb-4 text-2xl font-bold text-white"
            >
              {uiContent.about.contactTitle}
            </h2>
            <p className="text-slate-300">
              {uiContent.about.contactPrefix}{' '}
              <a
                href={`mailto:${env.CONTACT_EMAIL}`}
                className="font-medium text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
              >
                {env.CONTACT_EMAIL}
              </a>
              .
            </p>
            <div className="mt-4">
              <SocialMediaLinks socialMedia={socialMedia} />
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  )
}
