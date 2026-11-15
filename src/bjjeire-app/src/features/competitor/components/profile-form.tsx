import { useState, type JSX, type SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button/button'
import { FormField } from '@/components/ui/form/form-field'
import { SelectField } from '@/components/ui/form/select-field'
import { uiContent } from '@/config/ui-content'
import { CompetitorProfileTestIds } from '@/constants/competitorDataTestIds'
import { ISO_COUNTRY_CODES } from '@/constants/countries'
import { BELTS, GENDERS, type Belt, type Gender } from '@/types/tournaments'
import type { SaveCompetitorCommand } from '@/types/competitor'
import { dublinToday } from '@/utils/dublin-time'
import {
  toSaveCompetitorCommand,
  validateProfileForm,
  type ProfileFormErrors,
  type ProfileFormValues,
} from '../utils/profile-form'
import { AcademyPicker } from './academy-picker'

const { form, profile } = uiContent.competitor
const { genders, belts } = uiContent.tournaments

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
const COUNTRY_OPTIONS = ISO_COUNTRY_CODES.map(code => ({
  value: code,
  label: regionNames.of(code) ?? code,
  // map() returns a new array, so sorting it in place changes nothing shared.
})).sort((a, b) => a.label.localeCompare(b.label, 'en'))
const GENDER_OPTIONS = GENDERS.map(value => ({ value, label: genders[value] }))
const BELT_OPTIONS = BELTS.map(value => ({ value, label: belts[value] }))

interface ProfileFormProps {
  initialValues: ProfileFormValues
  isSaving: boolean
  error: string | null
  notice: string | null
  onSubmit: (command: SaveCompetitorCommand) => void
}

export const ProfileForm = function ProfileForm({
  initialValues,
  isSaving,
  error,
  notice,
  onSubmit,
}: ProfileFormProps): JSX.Element {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<ProfileFormErrors>({})

  function set<K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K]
  ): void {
    setValues(current => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault()
    const found = validateProfileForm(values, dublinToday())
    setErrors(found)
    if (Object.keys(found).length === 0) {
      onSubmit(toSaveCompetitorCommand(values))
    }
  }

  const text = (
    field: keyof ProfileFormValues,
    label: string,
    extra: { type?: 'text' | 'date' | 'tel'; className?: string; hint?: string } = {}
  ): JSX.Element => (
    <FormField
      id={`competitor-${field}`}
      label={label}
      value={values[field]}
      onChange={value => set(field, value)}
      error={errors[field]}
      {...extra}
    />
  )

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="space-y-8"
      data-testid={CompetitorProfileTestIds.FORM}
    >
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-fg">{form.detailsHeading}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {text('firstName', form.firstName)}
          {text('middleName', form.middleName)}
          {text('lastName', form.lastName)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="competitor-nationality"
            label={form.nationality}
            value={values.nationality}
            onChange={value => set('nationality', value)}
            options={COUNTRY_OPTIONS}
            placeholder={form.nationalityPlaceholder}
            error={errors.nationality}
          />
          {text('dateOfBirth', form.dateOfBirth, { type: 'date' })}
          <SelectField
            id="competitor-gender"
            label={form.gender}
            value={values.gender}
            onChange={value => set('gender', value as Gender | '')}
            options={GENDER_OPTIONS}
            placeholder={form.choose}
            error={errors.gender}
          />
          <SelectField
            id="competitor-belt"
            label={form.belt}
            value={values.belt}
            onChange={value => set('belt', value as Belt | '')}
            options={BELT_OPTIONS}
            placeholder={form.choose}
            error={errors.belt}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-fg">{form.teamHeading}</h2>
        <AcademyPicker
          mode={values.academyMode}
          gymId={values.academyGymId}
          name={values.academyName}
          errors={errors}
          onModeChange={mode =>
            setValues(current => ({
              ...current,
              academyMode: mode,
              academyGymId: mode === 'directory' ? current.academyGymId : '',
              academyName:
                mode === 'directory' && current.academyGymId === ''
                  ? ''
                  : current.academyName,
            }))
          }
          onGymChange={(gymId, name) =>
            setValues(current => ({
              ...current,
              academyGymId: gymId,
              academyName: name,
            }))
          }
          onNameChange={name => set('academyName', name)}
        />
        {text('affiliation', form.affiliation, { hint: form.affiliationHint })}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-fg">{form.contactHeading}</h2>
          <p className="text-sm text-fg-subtle">{form.contactHint}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('phone', form.phone, { type: 'tel' })}
          {text('street', form.street)}
          {text('postcode', form.postcode)}
          {text('city', form.city)}
          {text('region', form.region)}
          <SelectField
            id="competitor-country"
            label={form.country}
            value={values.country}
            onChange={value => set('country', value)}
            options={COUNTRY_OPTIONS}
            placeholder={form.nationalityPlaceholder}
          />
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={CompetitorProfileTestIds.FORM_ERROR}
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="text-sm text-fg"
          data-testid={CompetitorProfileTestIds.FORM_NOTICE}
        >
          {notice}
        </p>
      )}
      <Button
        type="submit"
        disabled={isSaving}
        data-testid={CompetitorProfileTestIds.SUBMIT}
      >
        {isSaving ? profile.saving : profile.submit}
      </Button>
    </form>
  )
}
