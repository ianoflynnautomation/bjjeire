import React, { memo } from 'react'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { ensureExternalUrlScheme } from '../../../../utils/formattingUtils'
import { GymCardTestIds } from '../../../../constants/gymDataTestIds'

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
    'data-testid': rootDataTestIdFromParent,
    testIdInstanceSuffix = '',
  }) => {
    const externalWebsiteUrl =
      websiteUrl && websiteUrl.trim() !== ''
        ? ensureExternalUrlScheme(websiteUrl)
        : undefined

    const actualRootDataTestId =
      rootDataTestIdFromParent ||
      GymCardTestIds.FOOTER.ROOT(testIdInstanceSuffix)

    const websiteLinkTestId =
      GymCardTestIds.FOOTER.WEBSITE_LINK(testIdInstanceSuffix)

    const isDisabled = !externalWebsiteUrl
    const buttonText = externalWebsiteUrl
      ? 'Visit Website'
      : 'Website Unavailable'
    const ariaLabel = externalWebsiteUrl
      ? `Visit website for ${gymName || 'this gym'}`
      : `No website available for ${gymName || 'this gym'}`
    const title = isDisabled
      ? `No website available for ${gymName || 'this gym'}`
      : `Visit website for ${gymName || 'this gym'}`

    return (
      <div
        className="mt-auto border-t border-slate-200 pt-3 dark:border-slate-700"
        data-testid={actualRootDataTestId}
      >
        {isDisabled ? (
          <button
            disabled
            aria-disabled="true"
            aria-label={ariaLabel}
            title={title}
            data-testid={websiteLinkTestId}
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-x-2 rounded-md bg-gray-400 px-3.5 py-2 text-sm font-semibold text-white opacity-50 shadow-sm"
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
            className="inline-flex w-full items-center justify-center gap-x-2 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            aria-label={ariaLabel}
            title={title}
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
