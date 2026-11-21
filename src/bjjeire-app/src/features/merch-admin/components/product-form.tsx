import { useState, type JSX, type SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button/button'
import { FormField } from '@/components/ui/form/form-field'
import { SelectField } from '@/components/ui/form/select-field'
import { uiContent } from '@/config/ui-content'
import { MerchAdminTestIds } from '@/constants/merchDataTestIds'
import {
  PRODUCT_KINDS,
  SIZE_IDS,
  type CreateProductCommand,
  type ProductKind,
  type SizeId,
} from '@/types/products'
import {
  toCreateCommand,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from '../utils/product-form'

const { form } = uiContent.merchAdmin
const { kinds } = uiContent.merch

type TextField = 'name' | 'slug' | 'description' | 'price'

interface ProductFormProps {
  initialValues: ProductFormValues
  /** Held in checkouts per size; a size with holds shows how many. */
  held?: Partial<Record<SizeId, number>>
  submitLabel: string
  savingLabel: string
  isSaving: boolean
  onSubmit: (command: CreateProductCommand) => void
  error?: string | null
}

/** A product's details and the sizes it comes in, with the stock of each (#6013). */
export const ProductForm = function ProductForm({
  initialValues,
  held = {},
  submitLabel,
  savingLabel,
  isSaving,
  onSubmit,
  error,
}: ProductFormProps): JSX.Element {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  function update(next: ProductFormValues): void {
    setValues(next)
    if (submitted) {
      setErrors(validateProductForm(next))
    }
  }

  function setSize(
    size: SizeId,
    change: Partial<ProductFormValues['sizes'][SizeId]>
  ): void {
    update({
      ...values,
      sizes: { ...values.sizes, [size]: { ...values.sizes[size], ...change } },
    })
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault()
    setSubmitted(true)
    const found = validateProductForm(values)
    setErrors(found)
    if (Object.keys(found).length === 0) {
      onSubmit(toCreateCommand(values))
    }
  }

  const field = (
    name: TextField,
    label: string,
    extra: Partial<Parameters<typeof FormField>[0]> = {}
  ): JSX.Element => (
    <FormField
      id={`product-${name}`}
      label={label}
      value={values[name]}
      onChange={value => update({ ...values, [name]: value })}
      error={errors[name]}
      {...extra}
    />
  )

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="space-y-6"
      data-testid={MerchAdminTestIds.FORM}
    >
      <fieldset disabled={isSaving} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {field('name', form.name)}
          {field('slug', form.slug, { hint: form.slugHint })}
          <SelectField
            id="product-kind"
            label={form.kind}
            value={values.kind}
            onChange={value =>
              update({ ...values, kind: value as ProductKind })
            }
            options={PRODUCT_KINDS.map(kind => ({
              value: kind,
              label: kinds[kind],
            }))}
            placeholder={form.kind}
          />
          {field('price', form.price, {
            hint: form.priceHint,
            inputMode: 'decimal',
          })}
          {field('description', form.description, {
            multiline: true,
            className: 'md:col-span-2',
          })}
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-fg-muted">
            {form.sizesLegend}
          </legend>
          <p className="text-xs text-fg-subtle">{form.sizesHint}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SIZE_IDS.map(size => (
              <div
                key={size}
                className="flex items-end gap-3 rounded-lg p-3 ring-1 ring-hairline"
              >
                <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-fg">
                  <input
                    type="checkbox"
                    checked={values.sizes[size].offered}
                    onChange={event =>
                      setSize(size, { offered: event.target.checked })
                    }
                    aria-label={form.sizeOffered(size)}
                    className="h-4 w-4 accent-primary-600"
                  />
                  {size}
                </label>
                {values.sizes[size].offered && (
                  <div className="flex-1">
                    <FormField
                      id={`product-stock-${size}`}
                      label={form.stockFor(size)}
                      value={values.sizes[size].stock}
                      onChange={stock => setSize(size, { stock })}
                      inputMode="numeric"
                      hint={held[size] ? form.heldNote(held[size]) : undefined}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          {(errors.sizes ?? errors.stock) && (
            <p className="text-xs text-danger-600 dark:text-danger-400">
              {errors.sizes ?? errors.stock}
            </p>
          )}
        </fieldset>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="text-sm text-danger-600 dark:text-danger-400"
          data-testid={MerchAdminTestIds.FORM_ERROR}
        >
          {error}
        </p>
      )}
      <Button type="submit" disabled={isSaving}>
        {isSaving ? savingLabel : submitLabel}
      </Button>
    </form>
  )
}
