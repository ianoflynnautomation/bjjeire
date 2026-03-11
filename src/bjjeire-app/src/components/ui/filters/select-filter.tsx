import type React from 'react'
import { MapPinIcon } from '@heroicons/react/20/solid'
import { cn } from '@/lib/utils'
import { SelectFilterTestIds } from '@/constants/commonDataTestIds'

interface SelectFilterProps<T> {
  id: string
  label: string
  value: T | 'all' | undefined
  onChange: (value: T | 'all' | undefined) => void
  options: { value: T | 'all'; label: string }[]
  disabled?: boolean
  placeholderOptionLabel?: string
  Icon?: React.ComponentType<{ className?: string }>
  'data-testid'?: string
  className?: string
}

function SelectFilter<T extends string | number>({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholderOptionLabel,
  Icon = MapPinIcon,
  'data-testid': baseTestId = SelectFilterTestIds.ROOT,
  className,
}: SelectFilterProps<T>): React.JSX.Element {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedValue = event.target.value
    onChange(
      selectedValue === 'all' ? 'all' : (selectedValue as T) || undefined
    )
  }

  const iconPadding = Icon ? 'pl-10' : 'pl-4'

  return (
    <div className={cn('flex flex-col', className)} data-testid={baseTestId}>
      <label
        htmlFor={id}
        className="text-sm font-semibold text-slate-300"
        data-testid={SelectFilterTestIds.LABEL}
      >
        {label}
      </label>
      <div className="relative mt-1">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400"
            aria-hidden="true"
            data-testid={SelectFilterTestIds.ICON}
          />
        )}
        <select
          id={id}
          value={value === undefined ? 'all' : String(value)}
          onChange={handleChange}
          disabled={disabled}
          data-testid={SelectFilterTestIds.SELECT}
          className={cn(
            'block w-full rounded-xl border border-white/[0.10] bg-slate-700/50 py-2 pr-4 text-base text-slate-200 shadow-sm ring-1 ring-transparent transition-colors focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 sm:text-sm',
            iconPadding,
            disabled && 'cursor-not-allowed bg-slate-800/50 opacity-70'
          )}
        >
          {placeholderOptionLabel && (
            <option value="all" data-testid={SelectFilterTestIds.OPTION}>
              {placeholderOptionLabel}
            </option>
          )}
          {options.map(option => (
            <option
              key={String(option.value)}
              value={String(option.value)}
              data-testid={SelectFilterTestIds.OPTION}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default SelectFilter
