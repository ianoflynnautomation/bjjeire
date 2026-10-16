import {
  useLayoutEffect,
  useRef,
  type JSX,
  type MouseEvent,
  type SyntheticEvent,
} from 'react'
import { BitcoinIcon } from '@/components/ui/icons/bitcoin-icon'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { CloseIcon } from '@/components/ui/icons/close-icon'
import { SupportModalTestIds } from '@/constants/commonDataTestIds'
import { API_ROUTES } from '@/config/api-routes'
import { uiContent } from '@/config/ui-content'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

const SupportModal = function SupportModal({
  isOpen,
  onClose,
}: SupportModalProps): JSX.Element | null {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)

  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!isOpen || !dialog) {
      return
    }

    // jsdom's HTMLDialogElement has no showModal/close. Browsers use them for
    // the focus trap and the inert background. The open attribute alone is
    // only the fallback so the dialog is not hidden where showModal is missing.
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal()
      } else {
        dialog.open = true
      }
    }
    closeButtonRef.current?.focus()

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return
      }
      event.preventDefault()
      onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)

    return (): void => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      if (typeof dialog.close === 'function') {
        if (dialog.open) {
          dialog.close()
        }
      } else {
        dialog.open = false
      }
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const mainTitleId = SupportModalTestIds.TITLE
  const descriptionId = `${SupportModalTestIds.ROOT}-description`

  const onCancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    event.preventDefault()
    onClose()
  }

  const onBackdropMouseDown = (event: MouseEvent<HTMLDialogElement>): void => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={mainTitleId}
      aria-describedby={descriptionId}
      onCancel={onCancel}
      onMouseDown={onBackdropMouseDown}
      data-testid={SupportModalTestIds.OVERLAY}
      className="fixed top-1/2 left-1/2 m-0 w-[min(28rem,calc(100%-2rem))] max-w-md -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-fg backdrop:bg-overlay"
    >
      <div
        className="animate-modal-show rounded-2xl bg-surface-solid p-6 shadow-card ring-1 ring-hairline sm:p-8"
        data-testid={SupportModalTestIds.CONTENT}
      >
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BitcoinIcon className="h-8 w-8" />
            <h2
              id={mainTitleId}
              className="text-2xl font-bold text-fg"
              data-testid={mainTitleId}
            >
              {uiContent.supportModal.title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
            aria-label={uiContent.supportModal.closeLabel}
            data-testid={SupportModalTestIds.CLOSE_BUTTON}
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>
        <div className="space-y-6">
          <p className="text-fg-muted" id={descriptionId}>
            {uiContent.supportModal.description}
          </p>
          <div className="flex justify-center">
            <img
              src={API_ROUTES.donateBitcoinQr}
              alt={uiContent.supportModal.qrCodeAlt}
              className="h-48 w-48 rounded-xl bg-white p-2"
              data-testid={SupportModalTestIds.QR_CODE}
            />
          </div>
          <div
            className="rounded-2xl border border-warning-200 bg-warning-50/90 p-4 dark:border-warning-800/60 dark:bg-warning-950/50"
            data-testid={SupportModalTestIds.WARNING}
          >
            <p className="flex items-start gap-2 text-sm text-warning-900 dark:text-warning-500">
              <ExclamationTriangleIcon
                className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-500"
                aria-hidden="true"
                data-testid={`${SupportModalTestIds.WARNING}-icon`}
              />
              <span>{uiContent.supportModal.warning}</span>
            </p>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default SupportModal
