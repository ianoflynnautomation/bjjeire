import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Footer from '../footer'
import { renderWithProviders } from '@/testing/render-utils'
import { uiContent } from '@/config/ui-content'
import { paths } from '@/config/paths'
import { FooterTestIds } from '@/constants/commonDataTestIds'

vi.mock('@/config/env', () => ({
  env: {
    API_URL: 'http://localhost',
    PAGE_NUMBER: 1,
    PAGE_SIZE: 20,
    GITHUB_URL: 'https://github.com/owner/bjjeire',
  },
}))

vi.mock('@/hooks/useGitHubRepo', () => ({
  useGitHubRepo: (): { stars: number } => ({ stars: 128 }),
}))

describe('Footer', () => {
  it('given enabled gyms and events, when the footer renders, then those links and About are shown', () => {
    renderWithProviders(<Footer />, {
      featureFlags: { Gyms: true, BjjEvents: true },
    })

    expect(
      screen.getByRole('heading', { name: uiContent.footer.quickLinksTitle })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: paths.events.label })
    ).toHaveAttribute('href', paths.events.path)
    expect(
      screen.getByRole('link', { name: paths.gyms.label })
    ).toHaveAttribute('href', paths.gyms.path)
    expect(
      screen.getByRole('link', { name: paths.about.label })
    ).toHaveAttribute('href', paths.about.path)
    expect(
      screen.queryByRole('link', { name: paths.competitions.label })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: paths.stores.label })
    ).not.toBeInTheDocument()
  })

  it('given a GitHub URL, when the footer renders, then the contribute link and star count are shown', () => {
    renderWithProviders(<Footer />)

    const githubLink = screen.getByRole('link', {
      name: uiContent.footer.githubLinkLabel,
    })
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/owner/bjjeire'
    )
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(githubLink).toHaveTextContent('128')
    expect(githubLink).toHaveTextContent(uiContent.footer.githubStarsLabel)
  })

  it('given the current year, when the footer renders, then the copyright line includes the brand name', () => {
    renderWithProviders(<Footer />)

    const copyright = screen.getByTestId(FooterTestIds.COPYRIGHT)
    expect(copyright).toHaveTextContent(uiContent.brand.displayName)
    expect(copyright).toHaveTextContent(String(new Date().getFullYear()))
  })
})
