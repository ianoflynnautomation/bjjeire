import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { TournamentCompetitorsTestIds } from '@/constants/registrationDataTestIds'
import type { TournamentDto } from '@/types/tournaments'
import { useTournamentCompetitors } from '../hooks/useTournamentCompetitors'
import { divisionLabel } from '../utils/registration-format'

const { competitors } = uiContent.registrations

interface TournamentCompetitorsProps {
  tournament: TournamentDto
}

/**
 * The public competitor list: name, academy and affiliation of confirmed
 * sign-ups, per division (#5015, FR-011). Divisions with nobody confirmed are
 * left out.
 */
export const TournamentCompetitors = function TournamentCompetitors({
  tournament,
}: TournamentCompetitorsProps): JSX.Element {
  const query = useTournamentCompetitors(tournament.id)
  const lists = (query.data ?? []).filter(list => list.competitors.length > 0)

  return (
    <section
      aria-labelledby="tournament-competitors-heading"
      className="mt-8"
      data-testid={TournamentCompetitorsTestIds.ROOT}
    >
      <h2
        id="tournament-competitors-heading"
        className="mb-1 text-lg font-bold text-fg"
      >
        {competitors.heading}
      </h2>
      <p className="mb-3 text-sm text-fg-subtle">{competitors.intro}</p>
      {query.isError && (
        <p role="alert" className="text-sm text-fg-subtle">
          {competitors.loadFailed}
        </p>
      )}
      {query.isSuccess && lists.length === 0 && (
        <p
          className="text-sm text-fg-subtle"
          data-testid={TournamentCompetitorsTestIds.EMPTY}
        >
          {competitors.empty}
        </p>
      )}
      <div className="space-y-4">
        {lists.map(list => {
          const division = tournament.divisions.find(
            item => item.id === list.divisionId
          )
          const count = list.competitors.length
          return (
            <div
              key={list.divisionId}
              className="rounded-xl bg-surface-solid p-4 ring-1 ring-hairline"
              data-testid={TournamentCompetitorsTestIds.DIVISION}
            >
              <h3 className="text-sm font-semibold text-fg">
                {division ? divisionLabel(division) : list.divisionId}{' '}
                <span
                  className="font-normal text-fg-subtle"
                  data-testid={TournamentCompetitorsTestIds.DIVISION_COUNT}
                >
                  {`(${count} ${count === 1 ? competitors.countSingular : competitors.countPlural})`}
                </span>
              </h3>
              <ul className="mt-2 divide-y divide-hairline">
                {list.competitors.map((competitor, index) => (
                  <li
                    // Names are not unique; the position in the sorted list is stable for one response.
                    key={`${competitor.displayName}-${index}`}
                    className="flex flex-wrap justify-between gap-2 py-2 text-sm"
                    data-testid={TournamentCompetitorsTestIds.ROW}
                  >
                    <span className="font-semibold text-fg">
                      {competitor.displayName}
                    </span>
                    <span className="text-fg-muted">
                      {[
                        competitor.academy ?? competitors.noAcademy,
                        competitor.affiliation,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
