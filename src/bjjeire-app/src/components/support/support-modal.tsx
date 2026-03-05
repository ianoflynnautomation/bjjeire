// src/components/Support/SupportModal.tsx
import React, { useState, useCallback, useEffect, useRef, memo } from 'react'
import { cn } from '@/lib/utils'
import { ReactComponent as BitcoinIcon } from '@/assets/bitcoin.svg'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { env } from '@/config/env'
import { CloseIcon } from '@/components/ui/icons/close-icon'
import { SupportModalTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
  'data-testid'?: string
}

const SupportModal: React.FC<SupportModalProps> = memo(
  ({ isOpen, onClose, 'data-testid': _baseTestId }) => {
    const [copied, setCopied] = useState(false)
    const bitcoinAddress = env.BITCOIN_ADDRESS
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const dialogContentRef = useRef<HTMLDivElement>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)

    const mainTitleId = SupportModalTestIds.TITLE
    const descriptionId = `${SupportModalTestIds.ROOT}-description`
    const copyButtonBaseClasses =
      'w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto'
    const copyButtonCopiedClasses =
      'bg-emerald-600 focus-visible:ring-emerald-500'
    const copyButtonDefaultClasses =
      'border border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus-visible:ring-orange-500'

    const copyToClipboard = useCallback(async () => {
      if (!navigator.clipboard) {
        console.warn('Clipboard API not available.')
        return
      }
      try {
        await navigator.clipboard.writeText(bitcoinAddress)
        setCopied(true)
      } catch (err) {
        console.error('Failed to copy text: ', err)
      }
    }, [bitcoinAddress])

    useEffect(() => {
      if (!copied) {
        return
      }

      const timeoutId = window.setTimeout(() => {
        setCopied(false)
      }, 2000)

      return (): void => {
        window.clearTimeout(timeoutId)
      }
    }, [copied])

    useEffect(() => {
      if (!isOpen) {
        return
      }

      previousFocusRef.current = document.activeElement as HTMLElement | null
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      const onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
          return
        }

        if (event.key !== 'Tab' || !dialogContentRef.current) {
          return
        }

        const focusableElements = dialogContentRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )

        if (focusableElements.length === 0) {
          event.preventDefault()
          return
        }

        const first = focusableElements[0]
        const last = focusableElements[focusableElements.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }

      document.addEventListener('keydown', onKeyDown)
      requestAnimationFrame(() => closeButtonRef.current?.focus())

      return (): void => {
        document.removeEventListener('keydown', onKeyDown)
        document.body.style.overflow = originalOverflow
        previousFocusRef.current?.focus()
      }
    }, [isOpen, onClose])

    if (!isOpen) {
      return null
    }

    return (
      <div
        onMouseDown={event => {
          if (event.target === event.currentTarget) {
            onClose()
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
        data-testid={SupportModalTestIds.OVERLAY}
        role="dialog"
        aria-modal="true"
        aria-labelledby={mainTitleId}
        aria-describedby={descriptionId}
      >
        <div
          ref={dialogContentRef}
          className="animate-modal-show w-full max-w-md transform rounded-3xl border border-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/40 p-6 shadow-2xl shadow-emerald-900/10 transition-all duration-300 ease-in-out sm:p-8"
          data-testid={SupportModalTestIds.CONTENT}
        >
          <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BitcoinIcon className="h-8 w-8" />{' '}
              <h2
                id={mainTitleId}
                className="text-2xl font-bold text-slate-900"
                data-testid={mainTitleId}
              >
                {uiContent.supportModal.title}
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-emerald-100 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              aria-label={uiContent.supportModal.closeLabel}
              data-testid={SupportModalTestIds.CLOSE_BUTTON}
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </header>
          <div className="space-y-6">
            <p
              className="text-slate-700"
              id={descriptionId}
            >
              {uiContent.supportModal.description}
            </p>
            <div
              className="rounded-2xl bg-white/90 p-4 shadow-inner ring-1 ring-emerald-100/70"
            >
              <p className="mb-2 text-sm text-slate-600">
                {uiContent.supportModal.addressLabel}
              </p>
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <code
                  className="flex-1 break-all rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 font-mono text-sm text-slate-800"
                  data-testid={SupportModalTestIds.BTC_ADDRESS}
                >
                  {bitcoinAddress}
                </code>
                <button
                  onClick={copyToClipboard}
                  className={cn(
                    copyButtonBaseClasses,
                    copied
                      ? copyButtonCopiedClasses
                      : copyButtonDefaultClasses
                  )}
                  data-testid={SupportModalTestIds.COPY_BUTTON}
                >
                  {copied
                    ? uiContent.supportModal.copiedButtonText
                    : uiContent.supportModal.copyButtonText}
                </button>
              </div>
              {copied && (
                <p
                  className="mt-2 text-center text-xs text-emerald-700 sm:text-right"
                  data-testid={SupportModalTestIds.COPIED_CONFIRMATION}
                >
                  {uiContent.supportModal.copiedConfirmation}
                </p>
              )}
            </div>
            <div
              className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4"
              data-testid={SupportModalTestIds.WARNING}
            >
              <p className="flex items-start gap-2 text-sm text-yellow-900">
                <ExclamationTriangleIcon
                  className="h-5 w-5 flex-shrink-0 text-yellow-600"
                  aria-hidden="true"
                  data-testid={`${SupportModalTestIds.WARNING}-icon`}
                />
                <span>
                  {uiContent.supportModal.warning}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

export default SupportModal
