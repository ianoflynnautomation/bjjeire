import React, { memo } from 'react'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { ensureExternalUrlScheme } from '../../../utils/formattingUtils'
import { GymCardTestIds } from '../../../constants/gymDataTestIds'

interface GymFooterProps {
  websiteUrl?: string
  gymName: string
  'data-testid'?: string
  testIdInstanceSuffix?: string
}

export const GymFooter: React.FC<GymFooterProps> = memo(
  ({
    websiteUrl,
    gymName,
    'data-testid': rootDataTestId,
    testIdInstanceSuffix = '',
  }) => {
    if (!websiteUrl) {
      return null
    }

    const externalWebsiteUrl = websiteUrl
      ? ensureExternalUrlScheme(websiteUrl)
      : undefined
    const actualRootDataTestId =
      rootDataTestId || GymCardTestIds.FOOTER.ROOT(testIdInstanceSuffix)
    const websiteLinkTestId =
      GymCardTestIds.FOOTER.WEBSITE_LINK(testIdInstanceSuffix)

    const isDisabled = !externalWebsiteUrl
    const buttonText = externalWebsiteUrl
      ? 'Visit Website'
      : 'Website Unavailable'
    const ariaLabel = externalWebsiteUrl
      ? `Visit website for ${gymName || 'this gym'}`
      : `No website available for ${gymName || 'this gym'}`

    return (
      <div
        className="mt-auto border-t border-slate-200 dark:border-slate-700 pt-3"
        data-testid={actualRootDataTestId}
      >
        {isDisabled ? (
          <button
            disabled
            aria-disabled="true"
            aria-label={ariaLabel}
            title="No website available for this gym"
            data-testid={websiteLinkTestId}
            className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-gray-400 px-3.5 py-2 text-sm font-semibold text-white shadow-sm opacity-50 cursor-not-allowed"
          >
            <ArrowTopRightOnSquareIcon
              className="-ml-0.5 h-5 w-5"
              aria-hidden="true"
            />
            {buttonText}
          </button>
        ) : (
          <a
            href={externalWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={websiteLinkTestId}
            className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-colors"
            aria-label={ariaLabel}
          >
            <ArrowTopRightOnSquareIcon
              className="-ml-0.5 h-5 w-5"
              aria-hidden="true"
            />
            {buttonText}
          </a>
        )}
      </div>
    )
  }
)
