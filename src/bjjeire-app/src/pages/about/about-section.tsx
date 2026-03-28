import type { ReactNode, JSX } from 'react'

interface AboutSectionProps {
  id: string
  headingId: string
  title: string
  children: ReactNode
  'data-testid'?: string
}

export function AboutSection({
  id,
  headingId,
  title,
  children,
  'data-testid': dataTestId,
}: AboutSectionProps): JSX.Element {
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      data-testid={dataTestId}
      className="relative overflow-hidden rounded-3xl bg-white/80 p-6 backdrop-blur-sm ring-1 ring-black/8 dark:bg-slate-800/40 dark:ring-white/8"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-emerald-500 via-white/30 to-orange-500"
        aria-hidden="true"
      />
      <h2
        id={headingId}
        className="mb-4 text-2xl font-bold text-slate-900 dark:text-white"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
