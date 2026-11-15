import { useState, type JSX } from 'react'
import { Button } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import { TournamentAdminTestIds } from '@/constants/tournamentDataTestIds'
import {
  AGE_CATEGORIES,
  BELTS,
  DISCIPLINES,
  GENDERS,
  type DivisionDto,
} from '@/types/tournaments'
import {
  emptyDivisionSelection,
  generateDivisions,
  isSelectionComplete,
  type DivisionSelection,
} from '../utils/division-generator'

const { divisions: copy } = uiContent.tournamentAdmin
const labels = uiContent.tournaments

interface CheckboxGroupProps<T extends string> {
  legend: string
  options: readonly T[]
  optionLabels: Record<T, string>
  selected: T[]
  onChange: (selected: T[]) => void
}

function CheckboxGroup<T extends string>({
  legend,
  options,
  optionLabels,
  selected,
  onChange,
}: CheckboxGroupProps<T>): JSX.Element {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-fg-muted">{legend}</legend>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {options.map(option => (
          <label
            key={option}
            className="inline-flex items-center gap-1.5 text-sm text-fg"
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary-600"
              checked={selected.includes(option)}
              onChange={event =>
                onChange(
                  event.target.checked
                    ? [...selected, option]
                    : selected.filter(value => value !== option)
                )
              }
            />
            {optionLabels[option]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface DivisionGeneratorProps {
  onAdd: (divisions: DivisionDto[]) => void
}

export const DivisionGenerator = function DivisionGenerator({
  onAdd,
}: DivisionGeneratorProps): JSX.Element {
  const [selection, setSelection] = useState<DivisionSelection>(
    emptyDivisionSelection
  )
  const complete = isSelectionComplete(selection)
  const update = (patch: Partial<DivisionSelection>): void =>
    setSelection(current => ({ ...current, ...patch }))

  return (
    <section
      aria-labelledby="division-generator-heading"
      className="space-y-3 rounded-lg bg-muted p-4 ring-1 ring-hairline"
      data-testid={TournamentAdminTestIds.GENERATOR}
    >
      <h3 id="division-generator-heading" className="text-sm font-bold text-fg">
        {copy.generatorHeading}
      </h3>
      <p id="division-generator-hint" className="text-xs text-fg-subtle">
        {complete ? copy.generatorHint : copy.generatorIncomplete}
      </p>
      <CheckboxGroup
        legend={copy.disciplines}
        options={DISCIPLINES}
        optionLabels={labels.disciplines}
        selected={selection.disciplines}
        onChange={disciplines => update({ disciplines })}
      />
      <CheckboxGroup
        legend={copy.genders}
        options={GENDERS}
        optionLabels={labels.genders}
        selected={selection.genders}
        onChange={genders => update({ genders })}
      />
      <CheckboxGroup
        legend={copy.ageCategories}
        options={AGE_CATEGORIES}
        optionLabels={labels.ageCategories}
        selected={selection.ageCategories}
        onChange={ageCategories => update({ ageCategories })}
      />
      <CheckboxGroup
        legend={copy.belts}
        options={BELTS}
        optionLabels={labels.belts}
        selected={selection.belts}
        onChange={belts => update({ belts })}
      />
      <div className="flex flex-col">
        <label
          htmlFor="division-weight-classes"
          className="text-sm font-semibold text-fg-muted"
        >
          {copy.weightClasses}
        </label>
        <input
          id="division-weight-classes"
          type="text"
          value={selection.weightClasses}
          aria-describedby="division-weight-classes-hint"
          onChange={event => update({ weightClasses: event.target.value })}
          className="mt-1 block w-full rounded-lg border border-hairline bg-surface-solid px-3 py-2 text-base text-fg focus:outline-none focus:ring-2 focus:ring-ring-focus sm:text-sm"
        />
        <p
          id="division-weight-classes-hint"
          className="mt-1 text-xs text-fg-subtle"
        >
          {copy.weightClassesHint}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={!complete}
        aria-describedby="division-generator-hint"
        onClick={() => onAdd(generateDivisions(selection))}
        data-testid={TournamentAdminTestIds.GENERATE}
      >
        {copy.generate}
      </Button>
    </section>
  )
}
