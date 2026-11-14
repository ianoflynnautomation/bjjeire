import type { JSX } from 'react'
import { uiContent } from '@/config/ui-content'
import { TournamentPageTestIds } from '@/constants/tournamentDataTestIds'
import type { DivisionDto } from '@/types/tournaments'
import { groupDivisions } from '../utils/tournament-format'

const { details, ageCategories, belts } = uiContent.tournaments

interface DivisionGroupsProps {
  divisions: readonly DivisionDto[]
}

export const DivisionGroups = function DivisionGroups({
  divisions,
}: DivisionGroupsProps): JSX.Element {
  const groups = groupDivisions(divisions)

  if (groups.length === 0) {
    return <p className="text-sm text-fg-subtle">{details.noDivisions}</p>
  }

  return (
    <div
      className="grid gap-6 md:grid-cols-2"
      data-testid={TournamentPageTestIds.DIVISIONS}
    >
      {groups.map(group => (
        <section
          key={group.key}
          aria-labelledby={`division-group-${group.key}`}
          className="overflow-hidden rounded-xl bg-surface-solid ring-1 ring-hairline"
          data-testid={TournamentPageTestIds.DIVISION_GROUP}
        >
          <h3
            id={`division-group-${group.key}`}
            className="border-b border-hairline bg-muted px-4 py-2 text-sm font-bold text-fg"
          >
            {group.label}
          </h3>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-fg-subtle">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {details.ageColumn}
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {details.beltColumn}
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {details.weightColumn}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-fg-muted">
              {group.divisions.map((division, index) => (
                <tr
                  key={division.id ?? `${group.key}-${index}`}
                  data-testid={TournamentPageTestIds.DIVISION_ROW}
                >
                  <td className="px-4 py-2">
                    {ageCategories[division.ageCategory]}
                  </td>
                  <td className="px-4 py-2">{belts[division.belt]}</td>
                  <td className="px-4 py-2">{division.weightClass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
