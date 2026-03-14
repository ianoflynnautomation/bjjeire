import { memo } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/config/paths'
import { env } from '@/config/env'
import { FooterTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { GitHubIcon } from '@/components/ui/icons/github-icon'
import { useGitHubRepo } from '@/hooks/useGitHubRepo'

const footerPathKeys = ['events', 'gyms', 'about'] as const

interface FooterProps {
  'data-testid'?: string
}

const Footer = memo(function Footer({
  'data-testid': dataTestIdFromProp,
}: FooterProps) {
  const rootTestId = dataTestIdFromProp ?? FooterTestIds.ROOT
  const { stars } = useGitHubRepo(env.GITHUB_URL || undefined)

  return (
    <footer
      className="min-h-[280px] border-t border-white/6 bg-slate-950"
      data-testid={rootTestId}
    >
      <div className="mx-auto min-w-[320px] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Quick links */}
          <div>
            <h3
              className="mb-4 text-lg font-bold text-slate-100"
              data-testid={FooterTestIds.QUICK_LINKS_HEADING}
            >
              {uiContent.footer.quickLinksTitle}
            </h3>
            <ul className="space-y-2">
              {footerPathKeys.map(pathKey => {
                const pathConfig = paths[pathKey]
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

          {/* GitHub CTA */}
          {env.GITHUB_URL && (
            <div>
              <h3 className="mb-4 text-lg font-bold text-slate-100">
                {uiContent.footer.githubTitle}
              </h3>
              <a
                href={env.GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-xl bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-300 ring-1 ring-white/8 transition-colors hover:bg-slate-700/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
                data-testid={FooterTestIds.GITHUB_LINK}
                aria-label={uiContent.footer.githubLinkLabel}
              >
                <GitHubIcon className="h-5 w-5 shrink-0" />
                {uiContent.footer.githubLinkLabel}
                {stars !== undefined && (
                  <span
                    className="ml-1 rounded-full bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-300"
                    data-testid={FooterTestIds.GITHUB_STARS}
                  >
                    ★ {stars.toLocaleString()} {uiContent.footer.githubStarsLabel}
                  </span>
                )}
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-white/6 pt-8 text-center">
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
})

export default Footer
