import type { ReactNode, JSX } from 'react'
import { TricolorEdge } from '@/components/ui/decoration/tricolor-edge'

interface AboutSectionProps {
  id: string
  headingId: string
  title: string
  children: ReactNode
  'data-testid'?: string
}

export const AboutSection = function AboutSection({
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
      <TricolorEdge />
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
