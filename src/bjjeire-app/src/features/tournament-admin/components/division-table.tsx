import type { JSX } from 'react'
import { Button } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import { TournamentAdminTestIds } from '@/constants/tournamentDataTestIds'
import type { DivisionDto } from '@/types/tournaments'
import { divisionKey } from '../utils/division-generator'

const { divisions: copy } = uiContent.tournamentAdmin
const labels = uiContent.tournaments

interface DivisionTableProps {
  divisions: readonly DivisionDto[]
  onRemove: (index: number) => void
  readOnly: boolean
}

function describe(division: DivisionDto): string {
  return [
    labels.disciplines[division.discipline],
    labels.genders[division.gender],
    labels.ageCategories[division.ageCategory],
    labels.belts[division.belt],
    division.weightClass,
  ].join(', ')
}

export const DivisionTable = function DivisionTable({
  divisions,
  onRemove,
  readOnly,
}: DivisionTableProps): JSX.Element {
  const suffix =
    divisions.length === 1 ? copy.countSuffixSingular : copy.countSuffixPlural

  return (
    <div className="space-y-2">
      <p
        className="text-sm text-fg-muted"
        aria-live="polite"
        data-testid={TournamentAdminTestIds.DIVISION_COUNT}
      >
        {`${divisions.length} ${suffix}`}
      </p>
      {divisions.length === 0 ? (
        <p className="text-sm text-fg-subtle">{copy.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg ring-1 ring-hairline">
          <table
            className="w-full text-left text-sm"
            data-testid={TournamentAdminTestIds.DIVISION_TABLE}
          >
            <caption className="sr-only">{copy.tableCaption}</caption>
            <thead className="bg-muted text-xs uppercase tracking-wider text-fg-subtle">
              <tr>
                <th scope="col" className="px-3 py-2">
                  {copy.disciplineColumn}
                </th>
                <th scope="col" className="px-3 py-2">
                  {copy.genderColumn}
                </th>
                <th scope="col" className="px-3 py-2">
                  {copy.ageColumn}
                </th>
                <th scope="col" className="px-3 py-2">
                  {copy.beltColumn}
                </th>
                <th scope="col" className="px-3 py-2">
                  {copy.weightColumn}
                </th>
                {!readOnly && (
                  <th scope="col" className="px-3 py-2">
                    <span className="sr-only">{copy.actionsColumn}</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-fg-muted">
              {divisions.map((division, index) => (
                <tr
                  key={division.id ?? divisionKey(division)}
                  data-testid={TournamentAdminTestIds.DIVISION_ROW}
                >
                  <td className="px-3 py-1.5">
                    {labels.disciplines[division.discipline]}
                  </td>
                  <td className="px-3 py-1.5">
                    {labels.genders[division.gender]}
                  </td>
                  <td className="px-3 py-1.5">
                    {labels.ageCategories[division.ageCategory]}
                  </td>
                  <td className="px-3 py-1.5">{labels.belts[division.belt]}</td>
                  <td className="px-3 py-1.5">{division.weightClass}</td>
                  {!readOnly && (
                    <td className="px-3 py-1.5 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`${copy.removeAriaPrefix}: ${describe(division)}`}
                        onClick={() => onRemove(index)}
                        data-testid={TournamentAdminTestIds.DIVISION_REMOVE}
                      >
                        {copy.remove}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
