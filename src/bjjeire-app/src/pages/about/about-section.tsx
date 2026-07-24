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
      className="relative overflow-hidden rounded-3xl bg-surface p-6 backdrop-blur-sm ring-1 ring-hairline"
    >
      <TricolorEdge />
      <h2
        id={headingId}
        className="mb-4 text-2xl font-bold text-fg"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
