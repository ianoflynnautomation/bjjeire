import { memo } from 'react'
import { uiContent } from '@/config/ui-content'

const { hero } = uiContent.gyms

export const GymsHeroBanner = memo(function GymsHeroBanner() {
  return (
    <section
      className="relative mb-8 overflow-hidden rounded-3xl ring-1 ring-black/8 dark:ring-white/8"
      aria-label="BJJ Éire — Find gyms across Ireland"
    >
      {/* Banner image */}
      <img
        src="/bjjeiregym.jpg"
        alt={hero.imageAlt}
        className="h-64 w-full object-cover sm:h-80 md:h-96"
      />

      {/* Dark gradient overlay so text is legible */}
      <div
        className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/40 to-transparent"
        aria-hidden="true"
      />

      {/* Irish tricolor top accent */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-emerald-500 via-white/30 to-orange-500"
        aria-hidden="true"
      />

      {/* Text content anchored to bottom of banner */}
      <div className="absolute inset-x-0 bottom-0 px-6 py-8 sm:px-10">
        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
          {hero.tagline}
        </h1>
        <p className="mt-2 text-base text-slate-300 drop-shadow sm:text-lg">
          {hero.subtitle}
        </p>
      </div>
    </section>
  )
})
