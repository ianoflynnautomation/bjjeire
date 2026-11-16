import type { CSSProperties, JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionsFeaturedTestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import { useUpcomingBjjEireCompetitions } from '../hooks/useUpcomingBjjEireCompetitions'
import { BjjEireCompetitionCard } from './bjjeire-competition-card'

const { featured } = uiContent.bjjEireCompetitions

/**
 * BJJ Éire's own upcoming competitions, shown above the Competitions directory
 * (#3006). Renders nothing while loading, on error or when none is upcoming
 * (#3007): there is no placeholder.
 */
export const FeaturedBjjEireCompetitions =
  function FeaturedBjjEireCompetitions(): JSX.Element | null {
    const upcoming = useUpcomingBjjEireCompetitions()
    if (upcoming.length === 0) {
      return null
    }

    return (
      <section
        className="mb-8"
        aria-labelledby="featured-bjjeire-competitions-heading"
        data-testid={BjjEireCompetitionsFeaturedTestIds.FEATURED_SECTION}
      >
        <h2
          id="featured-bjjeire-competitions-heading"
          className="display-expanded text-xl font-bold text-fg"
        >
          {featured.heading}
        </h2>
        <p className="mb-4 text-sm text-fg-subtle">{featured.intro}</p>
        <ul
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label={featured.ariaLabel}
          data-testid={BjjEireCompetitionsFeaturedTestIds.FEATURED_LIST}
        >
          {upcoming.map((competition, index) => (
            <li
              key={competition.id}
              className="animate-rise"
              style={{ '--i': index } as CSSProperties}
            >
              <BjjEireCompetitionCard
                bjjEireCompetition={competition}
                dataTestId={BjjEireCompetitionsFeaturedTestIds.FEATURED_CARD}
              />
            </li>
          ))}
        </ul>
      </section>
    )
  }
