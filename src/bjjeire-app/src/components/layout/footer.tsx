import React, { memo } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/config/paths'
import { FooterTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'

const footerPathKeys = ['events', 'gyms'] as const

interface FooterProps {
  'data-testid'?: string
}

const Footer: React.FC<FooterProps> = ({
  'data-testid': dataTestIdFromProp,
}) => {
  const rootTestId = dataTestIdFromProp || FooterTestIds.ROOT

  const quickLinksSectionMinHeight = 'min-h-[120px]'

  return (
    <footer
      className="min-h-[280px] border-t border-white/[0.06] bg-slate-950"
      data-testid={rootTestId}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 min-w-[320px]">
        <div
          className={`grid grid-cols-1 gap-8 md:grid-cols-3 ${quickLinksSectionMinHeight}`}
        >
          <div>
            <h3
              className="mb-4 text-lg font-bold text-slate-100"
              data-testid={FooterTestIds.QUICK_LINKS_HEADING}
            >
              {uiContent.footer.quickLinksTitle}
            </h3>
            <ul className="space-y-2">
              {footerPathKeys.map(pathKey => {
                const pathConfig = paths[pathKey as keyof typeof paths]
                return (
                  <li key={pathKey}>
                    <Link
                      to={pathConfig.getHref()}
                      className="font-medium text-emerald-400 underline-offset-2 transition-colors hover:text-emerald-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
                      data-testid={FooterTestIds.QUICK_LINK}
                    >
                      {pathConfig.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/[0.06] pt-8 text-center">
          <p
            className="text-sm text-slate-500"
            data-testid={FooterTestIds.COPYRIGHT}
          >
            © {new Date().getFullYear()} {uiContent.brand.displayName}.{' '}
            {uiContent.footer.copyrightSuffix}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default memo(Footer)
