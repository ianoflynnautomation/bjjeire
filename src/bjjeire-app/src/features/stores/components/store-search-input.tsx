import { memo, useCallback, useRef } from 'react'
import type { JSX, KeyboardEvent } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { uiContent } from '@/config/ui-content'

const { search } = uiContent.stores

interface StoreSearchInputsProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  disabled?: boolean
  dataTestId?: string
}

export const StoreSearchInput = memo(function StoreSearchInput({
  value,
  onChange,
  onClear,
  disabled,
  dataTestId,
}: StoreSearchInputsProps): JSX.Element {
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
      <label
        htmlFor="store-search"
        className="text-sm font-semibold text-slate-600 dark:text-slate-300"
      >
        {search.label}
      </label>
      <div className="relative mt-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon
            className="h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
        </div>
        <input
          ref={inputRef}
          id="store-search"
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={search.placeholder}
          disabled={disabled}
          aria-label={search.label}
          autoComplete="off"
          className="block w-full rounded-xl border border-black/10 bg-white py-2 pl-10 pr-10 text-base text-slate-700 shadow-sm ring-1 ring-transparent transition-colors focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 sm:text-sm dark:border-white/10 dark:bg-slate-700/50 dark:text-slate-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            aria-label={search.clearLabel}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
})
