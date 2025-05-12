import React, { useState, useCallback } from 'react';
import clsx from 'clsx';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  'data-testid'?: string;
}

const BitcoinLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className || 'w-8 h-8'}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="11.5" fill="#F7931A" stroke="#E67E00" strokeWidth="1" />
    <path
      d="M17.0921 10.1344C17.0921 6.80063 14.4006 5.40063 11.4006 5.40063H7.20063V18.6006H11.4006C14.4006 18.6006 17.0921 17.2006 17.0921 13.8669C17.0921 12.2672 16.2006 10.9344 17.0921 10.1344ZM11.4006 7.20063C13.2006 7.20063 14.4006 7.80063 14.4006 9.60063C14.4006 11.4006 13.2006 12.0006 11.4006 12.0006H9.60063V7.20063H11.4006ZM11.4006 16.8006H9.60063V12.0006H11.4006C13.2006 12.0006 14.4006 12.6006 14.4006 14.4006C14.4006 16.2006 13.2006 16.8006 11.4006 16.8006Z"
      fill="white"
    />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className || 'w-6 h-6'}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  'data-testid': baseTestId = 'support-modal',
}) => {
  const [copied, setCopied] = useState(false);
  // It's good practice to keep sensitive or configurable data like addresses in a more managed place,
  // but for a simple component, this is acceptable.
  const bitcoinAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

  const copyToClipboard = useCallback(async () => {
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available.');
      // Optionally, implement a fallback for older browsers or non-secure contexts
      return;
    }
    try {
      await navigator.clipboard.writeText(bitcoinAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); 
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Optionally, provide user feedback about the copy failure
    }
  }, [bitcoinAddress]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-75 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out"
      data-testid={`${baseTestId}-overlay`}
      role="dialog" // For accessibility
      aria-modal="true" // For accessibility
      aria-labelledby={`${baseTestId}-title`} // For accessibility
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 sm:p-8 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow"
        data-testid={`${baseTestId}-content`}
      >
        {/* Modal Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <BitcoinLogoIcon className="w-8 h-8" />
            <h2
              id={`${baseTestId}-title`} // For aria-labelledby
              className="text-2xl font-bold text-slate-900 dark:text-white"
              data-testid={`${baseTestId}-main-title`}
            >
              Support BJJ World
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 transition-colors"
            aria-label="Close support modal"
            data-testid={`${baseTestId}-close-button`}
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Modal Body */}
        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-300">
            Support the BJJ Éire project by donating Bitcoin. Your contribution helps us maintain
            and improve the platform.
          </p>

          {/* Bitcoin Address Section */}
          <div
            className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg shadow-inner"
            data-testid={`${baseTestId}-address-section`}
          >
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Bitcoin Address:</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <code
                className="flex-1 bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-600 text-sm break-all text-slate-700 dark:text-slate-200"
                data-testid={`${baseTestId}-btc-address`}
              >
                {bitcoinAddress}
              </code>
              <button
                onClick={copyToClipboard}
                className={clsx(
                  'px-4 py-2.5 text-sm font-semibold text-white rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-700 shadow-sm w-full sm:w-auto',
                  copied
                    ? 'bg-emerald-600 dark:bg-emerald-500 focus-visible:ring-emerald-500'
                    : 'bg-[#F7931A] hover:bg-[#E67E00] dark:bg-orange-500 dark:hover:bg-orange-600 focus-visible:ring-orange-500 border border-orange-600 dark:border-orange-700'
                )}
                data-testid={`${baseTestId}-copy-button`}
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>
            {copied && (
              <p
                className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 text-center sm:text-right"
                data-testid={`${baseTestId}-copied-confirmation`}
              >
                Address copied to clipboard!
              </p>
            )}
          </div>

          {/* Warning Section */}
          <div
            className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg"
            data-testid={`${baseTestId}-warning-message`}
          >
            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
              <svg // Warning Icon
                className="w-5 h-5 flex-shrink-0 text-yellow-500 dark:text-yellow-400"
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
                Please double-check the address before sending any funds. We cannot recover funds
                sent to incorrect addresses.
              </span>
            </p>
          </div>
        </div>
      </div>
      {/* Basic CSS for modal animation */}
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
  );
};

export default SupportModal;
