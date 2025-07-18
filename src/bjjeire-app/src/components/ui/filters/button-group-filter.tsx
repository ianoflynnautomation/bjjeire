import clsx from 'clsx'
import {
  ButtonGroupFilterTestIds
} from '../../../constants/commonDataTestIds'

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
  testIdInstanceSuffix?: string
  className?: string
}

const ButtonGroupFilter = <T extends string | number>({
  label,
  options,
  selectedValue,
  onValueChange,
  disabled = false,
  dataTestId = ButtonGroupFilterTestIds.ROOT,
  className,
}: ButtonGroupFilterProps<T>) => {
  return (
    <div className={clsx('flex-1', className)} data-testid={dataTestId}>
      <label
        className="block text-sm font-medium text-slate-700 dark:text-slate-50 mb-1.5"
        data-testid={ButtonGroupFilterTestIds.LABEL}
      >
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {/* Render all buttons from options, including 'all' */}
        {options.map(option => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onValueChange(option.value)}
            disabled={disabled}
            data-testid={ButtonGroupFilterTestIds.BUTTON}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
              selectedValue === option.value
                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:border-emerald-500 dark:hover:bg-emerald-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 dark:hover:border-emerald-500',
              disabled
                ? 'opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                : ''
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ButtonGroupFilter
