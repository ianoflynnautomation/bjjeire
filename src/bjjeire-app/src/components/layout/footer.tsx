import type { JSX } from 'react'
import { Link } from 'react-router'
import { env } from '@/config/env'
import { FooterTestIds } from '@/constants/commonDataTestIds'
import { uiContent } from '@/config/ui-content'
import { GitHubIcon } from '@/components/ui/icons/github-icon'
import { useGitHubRepo } from '@/hooks/useGitHubRepo'
import { useNavItems } from './navigation/use-nav-items'

interface FooterProps {
  'data-testid'?: string
}

const Footer = function Footer({
  'data-testid': dataTestIdFromProp,
}: FooterProps): JSX.Element {
  const rootTestId = dataTestIdFromProp ?? FooterTestIds.ROOT
  const { stars } = useGitHubRepo(env.GITHUB_URL || undefined)
  const navItems = useNavItems()

  return (
    <footer
      className="min-h-70 border-t border-hairline bg-muted dark:bg-ink-950"
      data-testid={rootTestId}
    >
      <div className="mx-auto min-w-[320px] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Quick links */}
          <div>
            <h3
              className="mb-4 text-lg font-bold text-fg"
              data-testid={FooterTestIds.QUICK_LINKS_HEADING}
            >
              {uiContent.footer.quickLinksTitle}
            </h3>
            <ul className="space-y-2">
              {navItems.map(item => (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    viewTransition
                    className="font-medium text-primary-600 underline-offset-2 transition-colors hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:text-primary-400 dark:hover:text-primary-300"
                    data-testid={FooterTestIds.QUICK_LINK}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* GitHub CTA */}
          {env.GITHUB_URL && (
            <div>
              <h3 className="mb-4 text-lg font-bold text-fg">
                {uiContent.footer.githubTitle}
              </h3>
              <a
                href={env.GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-xl bg-muted px-4 py-2.5 text-sm font-medium text-fg-muted ring-1 ring-hairline transition-colors hover:bg-ink-200 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus dark:bg-ink-800/60 dark:hover:bg-ink-700/60 dark:hover:text-white"
                data-testid={FooterTestIds.GITHUB_LINK}
                aria-label={uiContent.footer.githubLinkLabel}
              >
                <GitHubIcon className="h-5 w-5 shrink-0" />
                {uiContent.footer.githubLinkLabel}
                {stars !== undefined && (
                  <span
                    className="ml-1 min-w-16 rounded-full bg-ink-200 px-2 py-0.5 text-xs font-semibold text-fg-muted dark:bg-ink-700 dark:text-ink-300"
                    data-testid={FooterTestIds.GITHUB_STARS}
                  >
                    ★ {stars.toLocaleString()}{' '}
                    {uiContent.footer.githubStarsLabel}
                  </span>
                )}
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-hairline pt-8 text-center">
          <p
            className="text-sm text-fg-subtle"
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

export default Footer
