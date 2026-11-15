import { useState, type JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button/button'
import { FormField } from '@/components/ui/form/form-field'
import { uiContent } from '@/config/ui-content'
import { CompetitorProfileTestIds } from '@/constants/competitorDataTestIds'
import { textMatchesSearch } from '@/utils/search-text'
import { getAllDirectoryGyms } from '../api/competitor-api'
import { DIRECTORY_GYMS_KEY } from '../api/query-keys'
import type { AcademyMode, ProfileFormErrors } from '../utils/profile-form'

const { form } = uiContent.competitor
const MAX_MATCHES = 8

interface AcademyPickerProps {
  mode: AcademyMode
  gymId: string
  name: string
  errors: ProfileFormErrors
  onModeChange: (mode: AcademyMode) => void
  onGymChange: (gymId: string, name: string) => void
  onNameChange: (name: string) => void
}

const MODES: readonly { mode: AcademyMode; label: string }[] = [
  { mode: 'directory', label: form.academyDirectory },
  { mode: 'typed', label: form.academyTyped },
  { mode: 'none', label: form.academyNone },
]

/**
 * The competitor's academy (#5008): a gym from the BJJ Éire directory, a
 * typed name when theirs is not listed, or no academy.
 */
export const AcademyPicker = function AcademyPicker({
  mode,
  gymId,
  name,
  errors,
  onModeChange,
  onGymChange,
  onNameChange,
}: AcademyPickerProps): JSX.Element {
  const [search, setSearch] = useState('')
  const gyms = useQuery({
    queryKey: DIRECTORY_GYMS_KEY,
    queryFn: getAllDirectoryGyms,
    enabled: mode === 'directory',
    staleTime: 10 * 60 * 1000,
  })
  const term = search.trim()
  const matches =
    term === ''
      ? []
      : (gyms.data ?? [])
          .filter(gym => textMatchesSearch(gym.name, term))
          .slice(0, MAX_MATCHES)

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-fg-muted">
        {form.academy}
      </legend>
      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-5">
        {MODES.map(option => (
          <label
            key={option.mode}
            className="flex min-h-11 items-center gap-2 text-sm text-fg"
          >
            <input
              type="radio"
              name="academy-mode"
              className="h-4 w-4 accent-primary-600"
              checked={mode === option.mode}
              onChange={() => onModeChange(option.mode)}
            />
            {option.label}
          </label>
        ))}
      </div>

      {mode === 'directory' && (
        <div className="space-y-2">
          {gymId === '' ? (
            <>
              <FormField
                id="competitor-academy-search"
                label={form.academySearch}
                type="search"
                value={search}
                onChange={setSearch}
                hint={form.academySearchPlaceholder}
                error={errors.academyGymId}
              />
              {gyms.isError && (
                <p role="alert" className="text-sm text-fg-subtle">
                  {form.academyLoadFailed}
                </p>
              )}
              {term !== '' && gyms.isSuccess && matches.length === 0 && (
                <p className="text-sm text-fg-subtle">
                  {form.academySearchEmpty}
                </p>
              )}
              {matches.length > 0 && (
                <ul
                  className="divide-y divide-hairline rounded-lg ring-1 ring-hairline"
                  data-testid={CompetitorProfileTestIds.ACADEMY_SEARCH}
                >
                  {matches.map(gym => (
                    <li key={gym.id}>
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center px-3 text-left text-sm text-fg hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
                        onClick={() => {
                          onGymChange(gym.id ?? '', gym.name)
                          setSearch('')
                        }}
                        data-testid={CompetitorProfileTestIds.ACADEMY_OPTION}
                      >
                        {gym.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
              <p
                className="text-sm text-fg"
                data-testid={CompetitorProfileTestIds.ACADEMY_SELECTED}
              >
                <span className="font-semibold">{form.academySelected}: </span>
                {name}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onGymChange('', '')}
              >
                {form.academyChange}
              </Button>
            </div>
          )}
        </div>
      )}

      {mode === 'typed' && (
        <FormField
          id="competitor-academy-name"
          label={form.academyName}
          value={name}
          onChange={onNameChange}
          error={errors.academyName}
        />
      )}
    </fieldset>
  )
}
