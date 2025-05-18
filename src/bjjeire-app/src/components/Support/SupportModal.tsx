import React, { useState, useCallback } from 'react'
import clsx from 'clsx'
import { ReactComponent as BitcoinIcon } from '@/assets/bitcoin.svg'
import { env } from '@/config/env'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
  'data-testid'?: string
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className || 'w-6 h-6'}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
)

const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  'data-testid': baseTestId = 'support-modal',
}) => {
  const [copied, setCopied] = useState(false)
  const bitcoinAddress = env.BITCOIN_ADDRESS

  const copyToClipboard = useCallback(async () => {
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available.')
      return
    }
    try {
      await navigator.clipboard.writeText(bitcoinAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }, [bitcoinAddress])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 transition-opacity duration-300 ease-in-out dark:bg-opacity-75"
      data-testid={`${baseTestId}-overlay`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${baseTestId}-title`}
    >
      <div
        className="w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all duration-300 ease-in-out animate-modalShow dark:bg-slate-800 sm:p-8"
        data-testid={`${baseTestId}-content`}
      >
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BitcoinIcon className="h-8 w-8" />
            <h2
              id={`${baseTestId}-title`}
              className="text-2xl font-bold text-slate-900 dark:text-white"
              data-testid={`${baseTestId}-main-title`}
            >
              Support Bjj Éire
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-slate-200 dark:focus-visible:ring-offset-slate-800"
            aria-label="Close support modal"
            data-testid={`${baseTestId}-close-button`}
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>
        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-300">
            Support the BJJ Éire project by donating Bitcoin. Your contribution
            helps us maintain and improve the platform.
          </p>
          <div
            className="rounded-lg bg-slate-50 p-4 shadow-inner dark:bg-slate-700"
            data-testid={`${baseTestId}-address-section`}
          >
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              Bitcoin Address:
            </p>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <code
                className="flex-1 rounded border border-slate-200 bg-white p-3 text-sm text-slate-700 break-all dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                data-testid={`${baseTestId}-btc-address`}
              >
                {bitcoinAddress}
              </code>
              <button
                onClick={copyToClipboard}
                className={clsx(
                  'w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-700 sm:w-auto',
                  copied
                    ? 'bg-emerald-600 focus-visible:ring-emerald-500 dark:bg-emerald-500'
                    : 'border border-orange-600 bg-[#F7931A] hover:bg-[#E67E00] focus-visible:ring-orange-500 dark:border-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600'
                )}
                data-testid={`${baseTestId}-copy-button`}
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>
            {copied && (
              <p
                className="mt-2 text-center text-xs text-emerald-600 dark:text-emerald-400 sm:text-right"
                data-testid={`${baseTestId}-copied-confirmation`}
              >
                Address copied to clipboard!
              </p>
            )}
          </div>
          <div
            className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/30"
            data-testid={`${baseTestId}-warning-message`}
          >
            <p className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
              <svg
                className="h-5 w-5 flex-shrink-0 text-yellow-500 dark:text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-5.75a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Please double-check the address before sending any funds. We
                cannot recover funds sent to incorrect addresses.
              </span>
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes modalShow {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-modalShow {
          animation: modalShow 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default SupportModal
