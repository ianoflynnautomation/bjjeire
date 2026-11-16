import type { JSX } from 'react'
import { cn } from '@/lib/cn'

interface SelectFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  /** Shown as the empty first option. */
  placeholder: string
  error?: string
  className?: string
  dataTestId?: string
}

const controlClass =
  'mt-1 block w-full rounded-lg border bg-surface-solid px-3 py-2 text-base text-fg shadow-card focus:outline-none focus:ring-2 focus:ring-ring-focus sm:text-sm'

export const SelectField = function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  className,
  dataTestId,
}: SelectFieldProps): JSX.Element {
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-fg-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        onChange={event => onChange(event.target.value)}
        data-testid={dataTestId}
        className={cn(
          controlClass,
          error ? 'border-danger-500' : 'border-hairline'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          id={errorId}
          className="mt-1 text-xs text-danger-600 dark:text-danger-400"
        >
          {error}
        </p>
      )}
    </div>
  )
}
