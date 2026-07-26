import type { ChangeEvent, ComponentType, JSX } from 'react'
import { MapPinIcon } from '@heroicons/react/20/solid'
import { cn } from '@/lib/cn'
import { SelectFilterTestIds } from '@/constants/commonDataTestIds'

interface SelectFilterProps<T> {
  id: string
  label: string
  value: T | 'all' | undefined
  onChange: (value: T | 'all' | undefined) => void
  options: { value: T | 'all'; label: string }[]
  disabled?: boolean
  placeholderOptionLabel?: string
  Icon?: ComponentType<{ className?: string }>
  'data-testid'?: string
  className?: string
}

function SelectFilterBase<T extends string | number>({
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
}: SelectFilterProps<T>): JSX.Element {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const selectedValue = event.target.value
    onChange(
      selectedValue === 'all' ? 'all' : (selectedValue as T) || undefined
    )
  }

  return (
    <div className={cn('flex flex-col', className)} data-testid={baseTestId}>
      <label
        htmlFor={id}
        className="text-sm font-semibold text-fg-muted"
        data-testid={SelectFilterTestIds.LABEL}
      >
        {label}
      </label>
      <div className="relative mt-1">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-400"
          aria-hidden="true"
          data-testid={SelectFilterTestIds.ICON}
        />
        <select
          id={id}
          value={value === undefined ? 'all' : String(value)}
          onChange={handleChange}
          disabled={disabled}
          data-testid={SelectFilterTestIds.SELECT}
          className={cn(
            'block w-full rounded-xl border border-hairline bg-surface-solid py-2 pr-4 text-base text-fg shadow-sm ring-1 ring-transparent transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-ring-focus sm:text-sm dark:bg-ink-700/50',
            'pl-10',
            disabled && 'cursor-not-allowed opacity-70 bg-muted'
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

const SelectFilter = SelectFilterBase

export default SelectFilter
