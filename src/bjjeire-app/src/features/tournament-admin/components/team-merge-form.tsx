import { useState, type JSX } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button/button'
import { SelectField } from '@/components/ui/form/select-field'
import { uiContent } from '@/config/ui-content'
import { TournamentAdminMergeTestIds } from '@/constants/tournamentDataTestIds'
import type { AdminRegistrationDto, TeamKind } from '@/types/registrations'
import { mergeTournamentTeams } from '../api/tournament-admin-api'
import { adminRegistrationsKey } from '../api/query-keys'
import { problemMessage } from '../utils/problem-message'

const copy = uiContent.tournamentAdmin.merge

interface TeamMergeFormProps {
  tournamentId: string
  registrations: AdminRegistrationDto[]
}

interface TeamName {
  key: string
  name: string
}

/** The distinct names of one kind on these sign-ups, one per grouping key. */
function teamNames(
  registrations: AdminRegistrationDto[],
  kind: TeamKind
): TeamName[] {
  const byKey = new Map<string, string>()
  for (const registration of registrations) {
    const key =
      kind === 'ACADEMY' ? registration.academyKey : registration.affiliationKey
    const name =
      kind === 'ACADEMY' ? registration.academy : registration.affiliation
    if (key && name && !byKey.has(key)) {
      byKey.set(key, name)
    }
  }
  return [...byKey].map(([key, name]) => ({ key, name }))
}

/** Merges differently typed academy or affiliation names so points are not split (FR-007). */
export const TeamMergeForm = function TeamMergeForm({
  tournamentId,
  registrations,
}: TeamMergeFormProps): JSX.Element {
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<TeamKind>('ACADEMY')
  const [selected, setSelected] = useState<string[]>([])
  const [target, setTarget] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const names = teamNames(registrations, kind)
  const merge = useMutation({
    mutationFn: () =>
      mergeTournamentTeams(tournamentId, {
        kind,
        fromKeys: selected,
        target: target.trim(),
      }),
    onSuccess: result => {
      setSelected([])
      setTarget('')
      setNotice(`${copy.mergedPrefix} ${result.updated} ${copy.mergedSuffix}`)
      void queryClient.invalidateQueries({
        queryKey: adminRegistrationsKey(tournamentId),
      })
    },
    onError: failure => setError(problemMessage(failure)),
  })

  function submit(): void {
    setNotice(null)
    if (selected.length === 0 || target.trim() === '') {
      setError(copy.needsTwo)
      return
    }
    setError(null)
    merge.mutate()
  }

  return (
    <section
      aria-labelledby="team-merge-heading"
      className="space-y-3"
      data-testid={TournamentAdminMergeTestIds.ROOT}
    >
      <h3 id="team-merge-heading" className="text-base font-bold text-fg">
        {copy.heading}
      </h3>
      <p className="text-sm text-fg-subtle">{copy.intro}</p>
      <SelectField
        id="team-merge-kind"
        label={copy.kindLabel}
        placeholder={copy.kindLabel}
        value={kind}
        onChange={value => {
          setKind(value === 'AFFILIATION' ? 'AFFILIATION' : 'ACADEMY')
          setSelected([])
        }}
        options={[
          { value: 'ACADEMY', label: copy.kinds.ACADEMY },
          { value: 'AFFILIATION', label: copy.kinds.AFFILIATION },
        ]}
        dataTestId={TournamentAdminMergeTestIds.KIND}
      />
      {names.length === 0 ? (
        <p className="text-sm text-fg-subtle">{copy.nothingToMerge}</p>
      ) : (
        <fieldset className="space-y-1">
          <legend className="text-sm font-semibold text-fg-muted">
            {copy.namesLabel}
          </legend>
          {names.map(({ key, name }) => (
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-fg"
              data-testid={TournamentAdminMergeTestIds.NAME_OPTION}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary-600"
                checked={selected.includes(key)}
                onChange={event =>
                  setSelected(current =>
                    event.target.checked
                      ? [...current, key]
                      : current.filter(value => value !== key)
                  )
                }
              />
              {name}
            </label>
          ))}
        </fieldset>
      )}
      <div className="flex flex-col">
        <label
          htmlFor="team-merge-target"
          className="text-sm font-semibold text-fg-muted"
        >
          {copy.targetLabel}
        </label>
        <input
          id="team-merge-target"
          type="text"
          maxLength={80}
          value={target}
          onChange={event => setTarget(event.target.value)}
          className="mt-1 block w-full rounded-lg border bg-surface-solid px-3 py-2 text-base text-fg shadow-card focus:outline-none focus:ring-2 focus:ring-ring-focus sm:text-sm"
          data-testid={TournamentAdminMergeTestIds.TARGET}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={merge.isPending}
        onClick={submit}
        data-testid={TournamentAdminMergeTestIds.SUBMIT}
      >
        {merge.isPending ? copy.merging : copy.submit}
      </Button>
      {notice && (
        <p
          role="status"
          className="text-sm text-fg"
          data-testid={TournamentAdminMergeTestIds.NOTICE}
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={TournamentAdminMergeTestIds.ERROR}
        >
          {error}
        </p>
      )}
    </section>
  )
}
