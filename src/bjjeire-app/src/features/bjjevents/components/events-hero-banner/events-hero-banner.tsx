import { memo } from 'react'
import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { EventsHeroBannerTestIds } from '@/constants/eventDataTestIds'

const { hero } = uiContent.events

export const EventsHeroBanner = memo(function EventsHeroBanner(): JSX.Element {
  return (
    <section
      className="relative mb-8 overflow-hidden rounded-3xl ring-1 ring-black/8 dark:ring-white/8"
      aria-label={hero.ariaLabel}
      data-testid={EventsHeroBannerTestIds.BANNER}
    >
      {/* Banner image */}
      {/* <img
        src="/irish-flag.jpg"
        alt={hero.imageAlt}
        className="h-44 w-full object-cover sm:h-64 md:h-80 lg:h-96"
        data-testid={EventsHeroBannerTestIds.IMAGE}
      /> */}
      <div
        className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/40 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-emerald-500 via-white/30 to-orange-500"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
        <h1
          className="text-2xl font-black tracking-tight text-white drop-shadow-lg sm:text-3xl lg:text-5xl"
          data-testid={EventsHeroBannerTestIds.TAGLINE}
        >
          {hero.tagline}
        </h1>
        <p
          className="mt-2 text-base text-slate-300 drop-shadow sm:text-lg"
          data-testid={EventsHeroBannerTestIds.SUBTITLE}
        >
          {hero.subtitle}
        </p>
      </div>
    </section>
  )
})
