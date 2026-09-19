import { useCallback, useRef } from 'react'
import type { JSX, KeyboardEvent } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'

export interface ListSearchContent {
  label: string
  placeholder: string
  clearLabel: string
}

interface ListSearchInputProps {
  inputId: string
  content: ListSearchContent
  value: string
  onChange: (value: string) => void
  onClear: () => void
  disabled?: boolean
  dataTestId?: string
}

export const ListSearchInput = function ListSearchInput({
  inputId,
  content,
  value,
  onChange,
  onClear,
  disabled,
  dataTestId,
}: ListSearchInputProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        onClear()
        inputRef.current?.blur()
      }
    },
    [onClear]
  )

  return (
    <div role="search" className="flex flex-col" data-testid={dataTestId}>
      <label htmlFor={inputId} className="text-sm font-semibold text-fg-muted">
        {content.label}
      </label>
      <div className="relative mt-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon
            className="h-4 w-4 text-fg-subtle"
            aria-hidden="true"
          />
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={content.placeholder}
          disabled={disabled}
          aria-label={content.label}
          data-testid="search-input"
          autoComplete="off"
          className="block w-full rounded-lg border border-hairline bg-surface-solid py-2 pl-10 pr-10 text-base text-fg shadow-card ring-1 ring-transparent transition-colors focus:border-primary-500/40 focus:outline-none focus:ring-2 focus:ring-ring-focus sm:text-sm disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            data-testid="search-clear-button"
            aria-label={content.clearLabel}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-fg-subtle hover:text-fg-muted transition-colors"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
