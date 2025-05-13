/* eslint-disable no-useless-escape */
import React, { memo } from 'react';
import { SparklesIcon } from '@heroicons/react/20/solid';
import { TrialOfferDto } from '../../types/gyms'; // Adjusted path
import { DetailItem } from '../../components/common/DetailItem';

interface GymTrialOfferProps {
  trialOffer?: TrialOfferDto;
  'data-testid'?: string;
}

export const GymTrialOffer: React.FC<GymTrialOfferProps> = memo(
  ({ trialOffer, 'data-testid': baseTestId = 'gym-trial-offer' }) => {
    if (!trialOffer || !trialOffer.isAvailable) {
      return null;
    }

    // --- Build the offer text using variables and JSX ---
    let offerPrimaryPart: string | null = null;

    if (trialOffer.freeClasses && trialOffer.freeClasses > 0) {
      offerPrimaryPart = `${trialOffer.freeClasses} free class${trialOffer.freeClasses > 1 ? 'es' : ''}`;
    } else if (trialOffer.freeDays && trialOffer.freeDays > 0) {
      offerPrimaryPart = `${trialOffer.freeDays} free day${trialOffer.freeDays > 1 ? 's' : ''}`;
    }

    // Construct the display content as JSX
    let displayContent: React.ReactNode;
    const ariaTextParts: string[] = [];

    if (offerPrimaryPart) {
      ariaTextParts.push(offerPrimaryPart);
    }
    if (trialOffer.notes) {
      ariaTextParts.push(trialOffer.notes);
    }

    if (offerPrimaryPart && trialOffer.notes) {
      displayContent = (
        <>
          {offerPrimaryPart}. {trialOffer.notes}
        </>
      );
    } else if (offerPrimaryPart) {
      displayContent = <>{offerPrimaryPart}</>;
    } else if (trialOffer.notes) {
      displayContent = <>{trialOffer.notes}</>;
    } else {
      // Fallback if no specific details but offer is available
      const fallbackText = "Trial offer available (details not specified)";
      displayContent = fallbackText;
      ariaTextParts.push(fallbackText);
    }

    const finalAriaLabel = `Trial Offer: ${ariaTextParts.join('. ')}`;

    return (
      <DetailItem
        icon={<SparklesIcon />}
        ariaLabel={finalAriaLabel} // Use the constructed plain text for ARIA
        data-testid={baseTestId}
        className="mt-1 text-emerald-700 dark:text-emerald-400"
        iconClassName="h-5 w-5 text-amber-500 dark:text-amber-400"
      >
        <span className="font-medium">
          {displayContent} {/* Render the JSX content */}
        </span>
      </DetailItem>
    );
  }
);