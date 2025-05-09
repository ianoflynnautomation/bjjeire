import { useState } from 'react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
  const [copied, setCopied] = useState(false);
  const bitcoinAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"; // Replace with your actual Bitcoin address

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bitcoinAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#F7931A"/>
              <path d="M17.0921 10.1344C17.0921 6.80063 14.4006 5.40063 11.4006 5.40063H7.20063V18.6006H11.4006C14.4006 18.6006 17.0921 17.2006 17.0921 13.8669C17.0921 12.2672 16.2006 10.9344 17.0921 10.1344ZM11.4006 7.20063C13.2006 7.20063 14.4006 7.80063 14.4006 9.60063C14.4006 11.4006 13.2006 12.0006 11.4006 12.0006H9.60063V7.20063H11.4006ZM11.4006 16.8006H9.60063V12.0006H11.4006C13.2006 12.0006 14.4006 12.6006 14.4006 14.4006C14.4006 16.2006 13.2006 16.8006 11.4006 16.8006Z" fill="white"/>
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Support BJJ World</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Support the BJJ World project by donating Bitcoin. Your contribution helps us maintain and improve the platform.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Bitcoin Address:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white p-2 rounded border text-sm break-all">
                {bitcoinAddress}
              </code>
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-[#F7931A] text-white rounded hover:bg-[#E67E00] transition-colors border border-[#B35C00] shadow-sm"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Please double-check the address before sending any funds. We cannot recover funds sent to incorrect addresses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportModal; 