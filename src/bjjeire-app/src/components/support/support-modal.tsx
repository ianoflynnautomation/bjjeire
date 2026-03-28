import { useRef, memo } from 'react'
import { cn } from '@/lib/utils'
import { BitcoinIcon } from '@/components/ui/icons/bitcoin-icon'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { env } from '@/config/env'
import { CloseIcon } from '@/components/ui/icons/close-icon'
import { SupportModalTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useClipboard } from '@/hooks/useClipboard'

const copyButtonBaseClasses =
  'w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto'
const copyButtonCopiedClasses = 'bg-emerald-600 focus-visible:ring-emerald-500'
const copyButtonDefaultClasses =
  'border border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus-visible:ring-orange-500'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

const SupportModal = memo(function SupportModal({
  isOpen,
  onClose,
}: SupportModalProps) {
  const { copy, copied } = useClipboard()
  const bitcoinAddress = env.BITCOIN_ADDRESS
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useFocusTrap(isOpen, onClose, closeButtonRef)

  const mainTitleId = SupportModalTestIds.TITLE
  const descriptionId = `${SupportModalTestIds.ROOT}-description`

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
    >
      {/* NOSONAR: <dialog> breaks flex centering via browser default position:absolute — using div+role is intentional */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={mainTitleId}
        aria-describedby={descriptionId}
        className="animate-modal-show w-full max-w-md transform rounded-3xl border border-emerald-100/80 bg-linear-to-b from-white to-emerald-50/40 p-6 shadow-2xl shadow-emerald-900/10 transition-all duration-300 ease-in-out sm:p-8"
        data-testid={SupportModalTestIds.CONTENT}
      >
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BitcoinIcon className="h-8 w-8" />
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
          <p className="text-slate-700" id={descriptionId}>
            {uiContent.supportModal.description}
          </p>
          <div className="rounded-2xl bg-white/90 p-4 shadow-inner ring-1 ring-emerald-100/70">
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
                onClick={() => copy(bitcoinAddress)}
                className={cn(
                  copyButtonBaseClasses,
                  copied ? copyButtonCopiedClasses : copyButtonDefaultClasses
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
                className="h-5 w-5 shrink-0 text-yellow-600"
                aria-hidden="true"
                data-testid={`${SupportModalTestIds.WARNING}-icon`}
              />
              <span>{uiContent.supportModal.warning}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})

export default SupportModal
