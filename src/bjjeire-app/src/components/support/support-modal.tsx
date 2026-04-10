import { useRef, memo } from 'react'
import { BitcoinIcon } from '@/components/ui/icons/bitcoin-icon'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { CloseIcon } from '@/components/ui/icons/close-icon'
import { SupportModalTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

const SupportModal = memo(function SupportModal({
  isOpen,
  onClose,
}: SupportModalProps) {
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
          <div className="flex justify-center">
            <img
              src="/api/donate/bitcoin/qr"
              alt={uiContent.supportModal.qrCodeAlt}
              className="h-48 w-48 rounded-xl bg-white p-2"
              data-testid={SupportModalTestIds.QR_CODE}
            />
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
