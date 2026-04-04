import { memo } from 'react'
import type { JSX } from 'react'
import type { CompetitionDto } from '@/types/competitions'
import { CompetitionCard } from './competition-card/competition-card'
import { CompetitionsPageTestIds } from '@/constants/competitionDataTestIds'
import { uiContent } from '@/config/ui-content'

const { list } = uiContent.competitions

interface CompetitionsListProps {
  competitions: CompetitionDto[]
}

export const CompetitionsList = memo(function CompetitionsList({
  competitions,
}: CompetitionsListProps): JSX.Element {
  return (
    <ul
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-label={list.ariaLabel}
      data-testid={CompetitionsPageTestIds.LIST}
    >
      {competitions.map(competition => (
        <li key={competition.id}>
          <CompetitionCard competition={competition} />
        </li>
      ))}
    </ul>
  )
})
