// src/components/Filters/ButtonGroupFilter.tsx
import clsx from 'clsx'

export interface ButtonOption<T> {
  value: T
  label: string
}

interface ButtonGroupFilterProps<T> {
  label: string
  options: ButtonOption<T>[]
  selectedValue: T | undefined
  onValueChange: (value: T | 'all') => void 
  disabled?: boolean
  allOptionLabel?: string
}

const ButtonGroupFilter = <T extends string | number>({
  label,
  options,
  selectedValue,
  onValueChange,
  disabled = false,
  allOptionLabel = 'All Types',
}: ButtonGroupFilterProps<T>) => {
  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2">
        {/* "All" Button */}
        <button
          type="button"
          onClick={() => onValueChange('all')}
          disabled={disabled}
          className={clsx(
            'rounded-md px-3 py-1.5 text-sm font-medium border transition-colors',
            selectedValue === undefined
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400',
            disabled ? 'opacity-50 cursor-not-allowed hover:bg-white hover:border-slate-300' : ''
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
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium border transition-colors',
              selectedValue === option.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400',
              disabled ? 'opacity-50 cursor-not-allowed hover:bg-white hover:border-slate-300' : ''
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
