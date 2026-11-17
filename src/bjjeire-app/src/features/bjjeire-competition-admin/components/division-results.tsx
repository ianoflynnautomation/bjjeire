import { useState, type JSX } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button/button'
import { SelectField } from '@/components/ui/form/select-field'
import { uiContent } from '@/config/ui-content'
import { BjjEireCompetitionAdminResultsTestIds as TestIds } from '@/constants/bjjEireCompetitionDataTestIds'
import { bjjEireCompetitionLeaderboardKey } from '@/features/bjjeire-competitions/hooks/useBjjEireCompetitionLeaderboard'
import { divisionLabel } from '@/features/registrations/utils/registration-format'
import type {
  AdminDivisionResultDto,
  BjjEireCompetitionDto,
  ResultCompetitorDto,
} from '@/types/bjjeire-competitions'
import {
  clearDivisionResult,
  getBjjEireCompetitionResults,
  recordDivisionResult,
} from '../api/bjjeire-competition-admin-api'
import { adminResultsKey } from '../api/query-keys'
import {
  toRecordResultCommand,
  toResultFormValues,
  type ResultFormValues,
} from '../utils/division-result-form'
import { problemMessage } from '../utils/problem-message'

const copy = uiContent.bjjEireCompetitionAdmin.results

function competitorLabel(competitor: ResultCompetitorDto): string {
  return [competitor.displayName, competitor.academy]
    .filter(Boolean)
    .join(' · ')
}

interface DivisionResultFormProps {
  competitionId: string
  entry: AdminDivisionResultDto
}

const DivisionResultForm = function DivisionResultForm({
  competitionId,
  entry,
}: DivisionResultFormProps): JSX.Element {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ResultFormValues>(() =>
    toResultFormValues(entry.result)
  )
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const divisionId = entry.divisionId
  const options = entry.competitors.map(competitor => ({
    value: competitor.registrationId,
    label: competitorLabel(competitor),
  }))

  function stored(updated: AdminDivisionResultDto, message: string): void {
    queryClient.setQueryData<AdminDivisionResultDto[]>(
      adminResultsKey(competitionId),
      current =>
        current?.map(item => (item.divisionId === divisionId ? updated : item))
    )
    void queryClient.invalidateQueries({
      queryKey: bjjEireCompetitionLeaderboardKey(competitionId),
    })
    setNotice(message)
  }

  const save = useMutation({
    mutationFn: (command: Parameters<typeof recordDivisionResult>[2]) =>
      recordDivisionResult(competitionId, divisionId, command),
    onSuccess: updated => stored(updated, copy.saved),
    onError: failure => setError(problemMessage(failure)),
  })
  const clear = useMutation({
    mutationFn: () => clearDivisionResult(competitionId, divisionId),
    onSuccess: () => {
      setValues(toResultFormValues(null))
      stored({ ...entry, result: null }, copy.cleared)
    },
    onError: failure => setError(problemMessage(failure)),
  })

  function submit(): void {
    setError(null)
    setNotice(null)
    const check = toRecordResultCommand(values)
    if ('error' in check) {
      setError(check.error === 'needsGold' ? copy.needsGold : copy.duplicate)
      return
    }
    save.mutate(check.command)
  }

  const busy = save.isPending || clear.isPending
  const fieldId = `result-${divisionId}`

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          id={`${fieldId}-gold`}
          label={copy.goldLabel}
          placeholder={copy.choose}
          value={values.gold}
          onChange={gold => setValues(current => ({ ...current, gold }))}
          options={options}
          dataTestId={TestIds.GOLD}
        />
        <SelectField
          id={`${fieldId}-silver`}
          label={copy.silverLabel}
          placeholder={copy.nobody}
          value={values.silver}
          onChange={silver => setValues(current => ({ ...current, silver }))}
          options={options}
          dataTestId={TestIds.SILVER}
        />
        {values.bronzes.map((bronze, index) => (
          <SelectField
            // Two fixed bronze places.
            key={`bronze-${index}`}
            id={`${fieldId}-bronze-${index}`}
            label={`${copy.bronzeLabel} ${index + 1}`}
            placeholder={copy.nobody}
            value={bronze}
            onChange={id =>
              setValues(current => {
                const bronzes: [string, string] = [...current.bronzes]
                bronzes[index] = id
                return { ...current, bronzes }
              })
            }
            options={options}
            dataTestId={TestIds.BRONZE}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={submit}
          data-testid={TestIds.SAVE}
        >
          {save.isPending ? copy.saving : copy.save}
        </Button>
        {entry.result && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setError(null)
              setNotice(null)
              clear.mutate()
            }}
            data-testid={TestIds.CLEAR}
          >
            {copy.clear}
          </Button>
        )}
      </div>
      {notice && (
        <p
          role="status"
          className="text-sm text-fg"
          data-testid={TestIds.NOTICE}
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={TestIds.ERROR}
        >
          {error}
        </p>
      )}
    </div>
  )
}

interface DivisionResultsProps {
  bjjEireCompetition: BjjEireCompetitionDto
}

/** The organiser's results tab: one podium per division, from its confirmed competitors (FR-031). */
export const DivisionResults = function DivisionResults({
  bjjEireCompetition,
}: DivisionResultsProps): JSX.Element {
  const query = useQuery({
    queryKey: adminResultsKey(bjjEireCompetition.id),
    queryFn: () => getBjjEireCompetitionResults(bjjEireCompetition.id),
  })
  const entries = new Map(
    (query.data ?? []).map(entry => [entry.divisionId, entry])
  )

  return (
    <section
      aria-labelledby="bjjeire-competition-results-heading"
      className="space-y-4"
      data-testid={TestIds.ROOT}
    >
      <div>
        <h2
          id="bjjeire-competition-results-heading"
          className="text-xl font-bold text-fg"
        >
          {copy.heading}
        </h2>
        <p className="mt-1 text-sm text-fg-subtle">{copy.intro}</p>
      </div>
      {query.isError && (
        <p role="alert" className="text-sm text-fg-subtle">
          {copy.loadFailed}
        </p>
      )}
      {query.isSuccess &&
        bjjEireCompetition.divisions.map(division => {
          const id = division.id ?? ''
          const entry = entries.get(id)
          const competitors = entry?.competitors ?? []
          return (
            <div
              key={id}
              className="space-y-3 rounded-xl bg-surface-solid p-4 ring-1 ring-hairline"
              data-testid={TestIds.DIVISION}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-fg">
                  {divisionLabel(division)}
                </h3>
                <Badge
                  text={entry?.result ? copy.recorded : copy.notRecorded}
                  colorScheme={entry?.result ? 'emerald' : 'neutral'}
                  data-testid={TestIds.DIVISION_STATUS}
                />
              </div>
              {entry && competitors.length > 0 ? (
                <DivisionResultForm
                  competitionId={bjjEireCompetition.id}
                  entry={entry}
                />
              ) : (
                <p className="text-sm text-fg-subtle">{copy.noCompetitors}</p>
              )}
            </div>
          )
        })}
    </section>
  )
}
