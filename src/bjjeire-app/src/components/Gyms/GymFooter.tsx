import React, { memo } from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'; // Or LinkIcon
import { ensureExternalUrlScheme } from '../../utils/formattingUtils';


interface GymFooterProps {
  websiteUrl?: string;
  gymName: string;
  // Add other potential actions, e.g., onNavigateToDetails?: () => void;
}

export const GymFooter: React.FC<GymFooterProps> = memo(({ websiteUrl, gymName }) => {
  if (!websiteUrl) { // Only render footer if there's a primary action like website link
    return null;
  }

  const externalWebsiteUrl = ensureExternalUrlScheme(websiteUrl);

  return (
    <div className="mt-auto border-t border-slate-200 dark:border-slate-700 pt-3"> {/* Adjusted padding and added border */}
      <a
        href={externalWebsiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="gym-footer-website-link"
        className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out hover:from-emerald-700 hover:to-emerald-800 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700"
        aria-label={`Visit website for ${gymName || 'this gym'}`}
      >
        <ArrowTopRightOnSquareIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
        Visit Website
      </a>
    </div>
  );
});