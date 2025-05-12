import clsx from 'clsx'

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
  allOptionLabel?: string
  'data-testid'?: string
  className?: string
}

const ButtonGroupFilter = <T extends string | number>({
  label,
  options,
  selectedValue,
  onValueChange,
  disabled = false,
  allOptionLabel = 'All Types',
  'data-testid': baseTestId = 'button-group-filter',
  className,
}: ButtonGroupFilterProps<T>) => {
  return (
    <div className={clsx('flex-1', className)} data-testid={baseTestId}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {/* "All" Button */}
        <button
          type="button"
          onClick={() => onValueChange('all')}
          disabled={disabled}
          data-testid={`${baseTestId}-all-button`}
          className={clsx(
            'rounded-md px-3 py-1.5 text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
            selectedValue === undefined || selectedValue === 'all'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-600 dark:from-emerald-500 dark:to-emerald-600 dark:border-emerald-500'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 dark:hover:border-emerald-500',
            disabled
              ? 'opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              : ''
          )}
        >
          {allOptionLabel}
        </button>

        {/* Buttons for each option */}
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onValueChange(option.value)}
            disabled={disabled}
            data-testid={`${baseTestId}-button-${String(option.value).toLowerCase().replace(/\s+/g, '-')}`}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
              selectedValue === option.value
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-600 dark:from-emerald-500 dark:to-emerald-600 dark:border-emerald-500'
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
