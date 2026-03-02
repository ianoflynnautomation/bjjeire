import React from 'react'
import PageLayout from '@/components/layout/page-layout'
import { SocialMediaLinks } from '@/components/ui/social-media/social-media-links'

const AboutPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl py-10 sm:py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            About BJJ Eire
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            A community-first directory for Brazilian Jiu-Jitsu gyms and events across Ireland.
          </p>
        </header>

        <main className="space-y-8">
          <section
            aria-labelledby="about-mission-heading"
            className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800/60"
          >
            <h2
              id="about-mission-heading"
              className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100"
            >
              What We Do
            </h2>
            <div className="space-y-4 text-slate-700 dark:text-slate-300">
              <p>
                BJJ Eire helps practitioners discover gyms, seminars, tournaments, camps, and open mats in a
                single place. The project aims to make finding accurate local training information fast and simple.
              </p>
              <p>
                We focus on clear listings, practical filtering, and links that take people directly to gym and event
                sources for up-to-date details.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="about-values-heading"
            className="rounded-lg bg-slate-50 p-6 shadow-sm dark:bg-slate-800"
          >
            <h2
              id="about-values-heading"
              className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100"
            >
              Project Principles
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-slate-700 dark:text-slate-300">
              <li>Keep data easy to browse and compare.</li>
              <li>Prioritize accessibility across devices and input methods.</li>
              <li>Make contribution and correction workflows straightforward.</li>
            </ul>
          </section>

          <section
            aria-labelledby="about-contact-heading"
            className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800/60"
          >
            <h2
              id="about-contact-heading"
              className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100"
            >
              Contact
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              For updates, corrections, or partnership requests, email{' '}
              <a
                href="mailto:info@bjj-eire.com"
                className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                info@bjj-eire.com
              </a>
              .
            </p>
            <div className="mt-4">
              <SocialMediaLinks
                socialMedia={{
                  instagram: 'https://instagram.com/bjj_eire',
                  facebook: 'https://facebook.com/bjjeire',
                }}
              />
            </div>
          </section>
        </main>
      </div>
    </PageLayout>
  )
}

export default AboutPage
