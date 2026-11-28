import { useState, type JSX, type SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button/button'
import { FormField } from '@/components/ui/form/form-field'
import { uiContent } from '@/config/ui-content'
import { CheckoutTestIds } from '@/constants/merchDataTestIds'
import type { DeliveryCountry } from '@/types/orders'
import {
  EMPTY_DETAILS,
  type CheckoutDetails,
  type CheckoutField,
  validateDetails,
} from '../utils/checkout-details'

const { checkout: copy } = uiContent.merch

interface CheckoutFormProps {
  /** "Pay €96.50". */
  submitLabel: string
  isSubmitting: boolean
  onSubmit: (details: CheckoutDetails) => void
}

/**
 * A guest's name, email and delivery address (#6006, #6012). No account and no
 * sign-in. Only Ireland and Northern Ireland are offered (FR-017).
 */
export const CheckoutForm = function CheckoutForm({
  submitLabel,
  isSubmitting,
  onSubmit,
}: CheckoutFormProps): JSX.Element {
  const [details, setDetails] = useState<CheckoutDetails>(EMPTY_DETAILS)
  const [errors, setErrors] = useState<Partial<Record<CheckoutField, string>>>(
    {}
  )

  const set =
    (field: CheckoutField) =>
    (value: string): void =>
      setDetails(current => ({ ...current, [field]: value }))

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const found = validateDetails(details)
    setErrors(found)
    if (Object.keys(found).length === 0) {
      onSubmit(details)
    }
  }

  const northernIreland = details.country === 'GB'

  return (
    <form
      noValidate
      onSubmit={submit}
      className="space-y-6"
      data-testid={CheckoutTestIds.FORM}
    >
      <fieldset disabled={isSubmitting} className="space-y-4">
        <legend className="text-lg font-bold text-fg">
          {copy.detailsHeading}
        </legend>
        <p className="text-sm text-fg-subtle">{copy.guestNote}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            id="checkout-name"
            label={copy.name}
            value={details.name}
            onChange={set('name')}
            error={errors.name}
          />
          <FormField
            id="checkout-email"
            label={copy.email}
            type="email"
            value={details.email}
            onChange={set('email')}
            error={errors.email}
          />
        </div>
      </fieldset>

      <fieldset disabled={isSubmitting} className="space-y-4">
        <legend className="text-lg font-bold text-fg">
          {copy.addressHeading}
        </legend>
        <div className="flex flex-col">
          <label
            htmlFor="checkout-country"
            className="text-sm font-semibold text-fg-muted"
          >
            {copy.country}
          </label>
          <select
            id="checkout-country"
            value={details.country}
            onChange={event =>
              setDetails(current => ({
                ...current,
                country: event.target.value as DeliveryCountry,
              }))
            }
            className="mt-1 block w-full rounded-lg border border-hairline bg-surface-solid px-3 py-2 text-base text-fg shadow-card focus:outline-none focus:ring-2 focus:ring-ring-focus sm:text-sm md:w-1/2"
          >
            <option value="IE">{copy.countries.IE}</option>
            <option value="GB">{copy.countries.GB}</option>
          </select>
          <p className="mt-1 text-xs text-fg-subtle">{copy.deliveryNote}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            id="checkout-line1"
            label={copy.line1}
            value={details.line1}
            onChange={set('line1')}
            error={errors.line1}
          />
          <FormField
            id="checkout-line2"
            label={copy.line2}
            value={details.line2}
            onChange={set('line2')}
          />
          <FormField
            id="checkout-town"
            label={copy.town}
            value={details.town}
            onChange={set('town')}
            error={errors.town}
          />
          <FormField
            id="checkout-county"
            label={copy.county}
            value={details.county}
            onChange={set('county')}
            error={errors.county}
          />
          <FormField
            id="checkout-postcode"
            label={northernIreland ? copy.postcodeNi : copy.postcodeIe}
            hint={northernIreland ? copy.postcodeNiHint : undefined}
            value={details.postcode}
            onChange={set('postcode')}
            error={errors.postcode}
          />
          <FormField
            id="checkout-phone"
            label={copy.phone}
            type="tel"
            value={details.phone}
            onChange={set('phone')}
          />
        </div>
      </fieldset>

      <div className="space-y-1">
        <label className="flex items-start gap-3 text-sm text-fg">
          <input
            type="checkbox"
            checked={details.acceptTerms}
            disabled={isSubmitting}
            onChange={event =>
              setDetails(current => ({
                ...current,
                acceptTerms: event.target.checked,
              }))
            }
            aria-invalid={errors.acceptTerms ? true : undefined}
            className="mt-0.5 h-4 w-4 accent-primary-600"
          />
          <span>{copy.terms}</span>
        </label>
        {errors.acceptTerms && (
          <p className="text-xs text-danger-600 dark:text-danger-400">
            {errors.acceptTerms}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          data-testid={CheckoutTestIds.SUBMIT}
        >
          {isSubmitting ? copy.submitting : submitLabel}
        </Button>
        <p className="text-xs text-fg-subtle">{copy.secureNote}</p>
      </div>
    </form>
  )
}
