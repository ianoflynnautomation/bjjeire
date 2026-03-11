import React from 'react'
import PageLayout from '@/components/layout/page-layout'
import { SocialMediaLinks } from '@/components/ui/social-media/social-media-links'
import { uiContent } from '@/config/ui-content'
import { env } from '@/config/env'

const AboutPage: React.FC = () => {
  const socialMedia = {
    instagram: env.SOCIAL_INSTAGRAM_URL || undefined,
    facebook: env.SOCIAL_FACEBOOK_URL || undefined,
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl py-10 sm:py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-emerald-700 to-sky-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-sky-400">
            {uiContent.about.title}
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            {uiContent.about.subtitle}
          </p>
        </header>

        <main className="space-y-6">
          <section
            aria-labelledby="about-mission-heading"
            className="rounded-xl bg-white p-6 shadow-md border border-slate-200 border-t-2 border-t-emerald-500/70 dark:border-slate-700 dark:border-t-emerald-500/40 dark:bg-slate-800/60"
          >
            <h2
              id="about-mission-heading"
              className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              {uiContent.about.missionTitle}
            </h2>
            <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>{uiContent.about.missionParagraph1}</p>
              <p>{uiContent.about.missionParagraph2}</p>
            </div>
          </section>

          <section
            aria-labelledby="about-values-heading"
            className="rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/40 p-6 shadow-md ring-1 ring-slate-200/60 dark:from-slate-800 dark:to-slate-700/40 dark:ring-slate-700/40"
          >
            <h2
              id="about-values-heading"
              className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              {uiContent.about.principlesTitle}
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-slate-700 dark:text-slate-300 marker:text-emerald-500 dark:marker:text-emerald-400">
              {uiContent.about.principles.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="about-contact-heading"
            className="rounded-xl bg-white p-6 shadow-md border border-slate-200 border-t-2 border-t-emerald-500/70 dark:border-slate-700 dark:border-t-emerald-500/40 dark:bg-slate-800/60"
          >
            <h2
              id="about-contact-heading"
              className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              {uiContent.about.contactTitle}
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              {uiContent.about.contactPrefix}{' '}
              <a
                href={`mailto:${env.CONTACT_EMAIL}`}
                className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                {env.CONTACT_EMAIL}
              </a>
              .
            </p>
            <div className="mt-4">
              <SocialMediaLinks socialMedia={socialMedia} />
            </div>
          </section>
        </main>
      </div>
    </PageLayout>
  )
}

export default AboutPage
