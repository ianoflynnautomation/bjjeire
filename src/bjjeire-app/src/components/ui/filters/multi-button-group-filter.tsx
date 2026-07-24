import { useCallback } from 'react'
import type { JSX } from 'react'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/cn'
import { ButtonGroupFilterTestIds } from '@/constants/commonDataTestIds'
import type { ButtonOption } from './button-group-filter'

interface MultiButtonGroupFilterProps<T> {
  label: string
  allLabel: string
  options: ButtonOption<T>[]
  selectedValues: T[]
  onSelectionChange: (values: T[]) => void
  disabled?: boolean
  dataTestId?: string
  className?: string
}

function MultiButtonGroupFilterBase<T extends string | number>({
  label,
  allLabel,
  options,
  selectedValues,
  onSelectionChange,
  disabled = false,
  dataTestId = ButtonGroupFilterTestIds.ROOT,
  className,
}: MultiButtonGroupFilterProps<T>): JSX.Element {
  const isAllSelected = selectedValues.length === 0

  const toggleValue = useCallback(
    (value: T) =>
      onSelectionChange(
        selectedValues.includes(value)
          ? selectedValues.filter(v => v !== value)
          : [...selectedValues, value]
      ),
    [selectedValues, onSelectionChange]
  )

  const clearSelection = useCallback(
    () => onSelectionChange([]),
    [onSelectionChange]
  )

  return (
    <fieldset className={cn('flex-1', className)} data-testid={dataTestId}>
      <legend
        className="mb-1.5 block text-sm font-semibold text-fg-muted"
        data-testid={ButtonGroupFilterTestIds.LABEL}
      >
        {label}
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        <button
          type="button"
          onClick={clearSelection}
          disabled={disabled}
          aria-pressed={isAllSelected}
          data-testid={ButtonGroupFilterTestIds.BUTTON}
          className={cn(
            buttonVariants({
              variant: isAllSelected ? 'solid' : 'outline',
              size: 'sm',
            }),
            'min-h-11'
          )}
        >
          {allLabel}
        </button>
        {options.map(option => {
          const isSelected = selectedValues.includes(option.value)
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => toggleValue(option.value)}
              disabled={disabled}
              aria-pressed={isSelected}
              data-testid={ButtonGroupFilterTestIds.BUTTON}
              className={cn(
                buttonVariants({
                  variant: isSelected ? 'solid' : 'outline',
                  size: 'sm',
                }),
                'min-h-11'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export const MultiButtonGroupFilter = MultiButtonGroupFilterBase
