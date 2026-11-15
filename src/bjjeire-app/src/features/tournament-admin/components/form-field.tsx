import type { HTMLInputTypeAttribute, JSX } from 'react'
import { cn } from '@/lib/cn'

interface FormFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  type?: HTMLInputTypeAttribute
  inputMode?: 'text' | 'decimal' | 'numeric'
  multiline?: boolean
  className?: string
}

const controlClass =
  'mt-1 block w-full rounded-lg border bg-surface-solid px-3 py-2 text-base text-fg shadow-card focus:outline-none focus:ring-2 focus:ring-ring-focus disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 sm:text-sm'

export const FormField = function FormField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  inputMode,
  multiline = false,
  className,
}: FormFieldProps): JSX.Element {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const shared = {
    id,
    value,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    className: cn(
      controlClass,
      error ? 'border-danger-500' : 'border-hairline'
    ),
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-fg-muted">
        {label}
      </label>
      {multiline ? (
        <textarea
          {...shared}
          rows={5}
          onChange={event => onChange(event.target.value)}
        />
      ) : (
        <input
          {...shared}
          type={type}
          inputMode={inputMode}
          onChange={event => onChange(event.target.value)}
        />
      )}
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-fg-subtle">
          {hint}
        </p>
      )}
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
