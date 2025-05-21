import React from 'react'
import { MapPinIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import {
  SelectFilterTestIds,
  withTestIdSuffix,
} from '../../constants/commonDataTestIds'

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
  testIdInstanceSuffix?: string
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
  'data-testid': baseTestId = SelectFilterTestIds.ROOT(),
  testIdInstanceSuffix = '',
  className,
}: SelectFilterProps<T>) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value
    onChange(
      selectedValue === 'all' ? 'all' : (selectedValue as T) || undefined
    )
  }

  const iconPresent = Icon ? 'pl-10' : 'pl-4'

  return (
    <div className={clsx('flex flex-col', className)} data-testid={baseTestId}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 dark:text-slate-50"
        data-testid={withTestIdSuffix(
          SelectFilterTestIds.LABEL,
          testIdInstanceSuffix
        )}
      >
        {label}
      </label>
      <div className="relative mt-1">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500 dark:text-emerald-400 pointer-events-none"
            aria-hidden="true"
            data-testid={withTestIdSuffix(
              SelectFilterTestIds.ICON,
              testIdInstanceSuffix
            )}
          />
        )}
        <select
          id={id}
          value={value === undefined ? 'all' : String(value)}
          onChange={handleChange}
          disabled={disabled}
          data-testid={withTestIdSuffix(
            SelectFilterTestIds.SELECT,
            testIdInstanceSuffix
          )}
          className={clsx(
            'block w-full rounded-md border-slate-300 pr-4 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-500',
            iconPresent,
            disabled
              ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
              : ''
          )}
        >
          {placeholderOptionLabel && (
            <option
              value="all"
              data-testid={withTestIdSuffix(
                SelectFilterTestIds.PLACEHOLDER_OPTION,
                testIdInstanceSuffix
              )}
            >
              {placeholderOptionLabel}
            </option>
          )}
          {options.map(option => (
            <option
              key={String(option.value)}
              value={String(option.value)}
              data-testid={SelectFilterTestIds.OPTION(
                String(option.value).toLowerCase().replace(/\s+/g, '-'),
                testIdInstanceSuffix
              )}
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
