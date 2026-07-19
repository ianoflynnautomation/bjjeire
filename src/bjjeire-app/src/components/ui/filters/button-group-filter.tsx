import { memo } from 'react'
import type { JSX } from 'react'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/cn'
import { ButtonGroupFilterTestIds } from '@/constants/commonDataTestIds'

export interface ButtonOption<T> {
  value: T
  label: string
}

interface ButtonGroupFilterProps<T> {
  label: string
  options: ButtonOption<T>[]
  selectedValue: T | 'all' | undefined
  onValueChange: (value: T | 'all') => void
  disabled?: boolean
  dataTestId?: string
  className?: string
}

function ButtonGroupFilterBase<T extends string | number>({
  label,
  options,
  selectedValue,
  onValueChange,
  disabled = false,
  dataTestId = ButtonGroupFilterTestIds.ROOT,
  className,
}: ButtonGroupFilterProps<T>): JSX.Element {
  return (
    <fieldset className={cn('flex-1', className)} data-testid={dataTestId}>
      <legend
        className="mb-1.5 block text-sm font-semibold text-slate-600 dark:text-slate-300"
        data-testid={ButtonGroupFilterTestIds.LABEL}
      >
        {label}
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map(option => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onValueChange(option.value)}
            disabled={disabled}
            aria-pressed={selectedValue === option.value}
            data-testid={ButtonGroupFilterTestIds.BUTTON}
            className={cn(
              buttonVariants({
                variant: selectedValue === option.value ? 'solid' : 'outline',
                size: 'sm',
              }),
              'min-h-11'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

const ButtonGroupFilter = memo(
  ButtonGroupFilterBase
) as typeof ButtonGroupFilterBase

export default ButtonGroupFilter
