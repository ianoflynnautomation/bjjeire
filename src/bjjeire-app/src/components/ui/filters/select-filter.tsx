import type React from 'react'
import { MapPinIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
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
    onChange(selectedValue === 'all' ? 'all' : (selectedValue as T) || undefined)
  }

  const iconPadding = Icon ? 'pl-10' : 'pl-4'

  return (
    <div className={clsx('flex flex-col', className)} data-testid={baseTestId}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 dark:text-slate-50"
        data-testid={SelectFilterTestIds.LABEL}
      >
        {label}
      </label>
      <div className="relative mt-1">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500 dark:text-emerald-400"
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
          className={clsx(
            'block w-full rounded-md border-slate-300 py-2 pr-4 text-base focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-500',
            iconPadding,
            disabled && 'cursor-not-allowed bg-slate-100 opacity-70 dark:bg-slate-800'
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
