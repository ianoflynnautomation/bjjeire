import { useState, type JSX, type ReactNode, type SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button/button'
import { uiContent } from '@/config/ui-content'
import { TournamentAdminTestIds } from '@/constants/tournamentDataTestIds'
import type {
  DivisionDto,
  TournamentCommand,
  TournamentVenueDto,
} from '@/types/tournaments'
import { addDivisions } from '../utils/division-generator'
import {
  toCommand,
  validateTournamentForm,
  type TournamentFormErrors,
  type TournamentFormValues,
} from '../utils/tournament-form'
import { DivisionGenerator } from './division-generator'
import { DivisionTable } from './division-table'
import { FormField } from './form-field'

const { form, divisions: divisionCopy } = uiContent.tournamentAdmin

interface TournamentFormProps {
  initialValues: TournamentFormValues
  initialDivisions: readonly DivisionDto[]
  existingVenue?: TournamentVenueDto | null
  readOnly?: boolean
  submitLabel: string
  savingLabel: string
  isSaving: boolean
  onSubmit: (command: TournamentCommand) => void
  /** Told on the first change, so the page can hold back Publish until the change is saved. */
  onDirty?: () => void
  error?: string | null
  notice?: string | null
  /** Rendered beside the submit button, for Publish. */
  actions?: ReactNode
}

export const TournamentForm = function TournamentForm({
  initialValues,
  initialDivisions,
  existingVenue,
  readOnly = false,
  submitLabel,
  savingLabel,
  isSaving,
  onSubmit,
  onDirty,
  error,
  notice,
  actions,
}: TournamentFormProps): JSX.Element {
  const [values, setValues] = useState(initialValues)
  const [divisions, setDivisions] = useState<DivisionDto[]>([
    ...initialDivisions,
  ])
  const [errors, setErrors] = useState<TournamentFormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  function changed(): void {
    onDirty?.()
  }

  function setField(field: keyof TournamentFormValues, value: string): void {
    const next = { ...values, [field]: value }
    setValues(next)
    if (submitted) {
      setErrors(validateTournamentForm(next))
    }
    changed()
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault()
    setSubmitted(true)
    const found = validateTournamentForm(values)
    setErrors(found)
    if (Object.keys(found).length === 0) {
      onSubmit(toCommand(values, divisions, existingVenue))
    }
  }

  const field = (
    name: keyof TournamentFormValues,
    label: string,
    extra: Partial<Parameters<typeof FormField>[0]> = {}
  ): JSX.Element => (
    <FormField
      id={`tournament-${name}`}
      label={label}
      value={values[name]}
      onChange={value => setField(name, value)}
      error={errors[name]}
      {...extra}
    />
  )

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="space-y-8"
      data-testid={TournamentAdminTestIds.FORM}
    >
      <fieldset disabled={readOnly || isSaving} className="space-y-8">
        <section
          aria-labelledby="tournament-details-heading"
          className="space-y-4"
        >
          <h2
            id="tournament-details-heading"
            className="text-lg font-bold text-fg"
          >
            {form.detailsHeading}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {field('name', form.name)}
            {field('slug', form.slug, { hint: form.slugHint })}
            {field('date', form.date, { type: 'date' })}
            {field('entryFee', form.entryFee, { inputMode: 'decimal' })}
            {field('venueName', form.venueName)}
            {field('venueAddress', form.venueAddress)}
            {field('opensAt', form.opensAt, { type: 'datetime-local' })}
            {field('closesAt', form.closesAt, { type: 'datetime-local' })}
            {field('competitorLimit', form.competitorLimit, {
              inputMode: 'numeric',
              hint: form.competitorLimitHint,
            })}
          </div>
          {field('description', form.description, { multiline: true })}
        </section>

        <section
          aria-labelledby="tournament-divisions-heading"
          className="space-y-4"
        >
          <h2
            id="tournament-divisions-heading"
            className="text-lg font-bold text-fg"
          >
            {divisionCopy.heading}
          </h2>
          {!readOnly && (
            <DivisionGenerator
              onAdd={generated => {
                setDivisions(current => addDivisions(current, generated))
                changed()
              }}
            />
          )}
          <DivisionTable
            divisions={divisions}
            readOnly={readOnly}
            onRemove={index => {
              setDivisions(current => current.filter((_, i) => i !== index))
              changed()
            }}
          />
        </section>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-danger-500/25 bg-danger-50 p-3 text-sm text-danger-700 dark:bg-danger-950/50 dark:text-danger-300"
          data-testid={TournamentAdminTestIds.FORM_ERROR}
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-primary-50 p-3 text-sm text-primary-800 ring-1 ring-primary-700/20 dark:bg-primary-950/50 dark:text-primary-200"
          data-testid={TournamentAdminTestIds.FORM_NOTICE}
        >
          {notice}
        </p>
      )}

      {!readOnly && (
        <div className="flex flex-wrap items-start gap-3">
          <Button
            type="submit"
            disabled={isSaving}
            data-testid={TournamentAdminTestIds.SUBMIT}
          >
            {isSaving ? savingLabel : submitLabel}
          </Button>
          {actions}
        </div>
      )}
    </form>
  )
}
