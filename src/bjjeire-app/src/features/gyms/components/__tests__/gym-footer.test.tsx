import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GymFooter } from './../gym-card/gym-footer'
import { GymCardTestIds } from '../../../../constants/gymDataTestIds'
import { ensureExternalUrlScheme } from '../../../../utils/formattingUtils'

beforeEach(() => {
  vi.mocked(ensureExternalUrlScheme).mockClear()
})

vi.mock('../../../../../utils/formattingUtils', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    ensureExternalUrlScheme: vi.fn((url?: string) => {
      if (!url || url.trim() === '') return undefined
      if (!/^https?:\/\//i.test(url)) {
        return `https://${url}`
      }
      return url
    }),
  }
})

describe('GymFooter Component', () => {
  const defaultProps = {
    gymName: 'Test Gym Footer',
    testIdInstanceSuffix: 'test-suffix-footer',
  }

  beforeEach(() => {
    vi.mocked(ensureExternalUrlScheme).mockClear()
  })

  it('renders a disabled button if websiteUrl is not provided (undefined)', () => {
    render(<GymFooter {...defaultProps} websiteUrl={undefined} />)
    const button = screen.getByTestId(
      GymCardTestIds.FOOTER.WEBSITE_LINK(defaultProps.testIdInstanceSuffix)
    )
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Website Unavailable')
    expect(
      screen.getByTestId(
        GymCardTestIds.FOOTER.ROOT(defaultProps.testIdInstanceSuffix)
      )
    ).toBeInTheDocument()
  })

  it('renders a disabled button if websiteUrl is an empty string', () => {
    render(<GymFooter {...defaultProps} websiteUrl="" />)
    const button = screen.getByTestId(
      GymCardTestIds.FOOTER.WEBSITE_LINK(defaultProps.testIdInstanceSuffix)
    )
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Website Unavailable')
  })

  it('renders a disabled button if websiteUrl is only whitespace', () => {
    render(<GymFooter {...defaultProps} websiteUrl="   " />)
    const button = screen.getByTestId(
      GymCardTestIds.FOOTER.WEBSITE_LINK(defaultProps.testIdInstanceSuffix)
    )
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Website Unavailable')
  })

  it('renders an active link if websiteUrl is provided and valid', () => {
    const website = 'testgym.com'
    const schemedWebsite = `https://${website}`
    vi.mocked(ensureExternalUrlScheme).mockReturnValue(schemedWebsite)

    render(<GymFooter {...defaultProps} websiteUrl={website} />)

    const link = screen.getByTestId(
      GymCardTestIds.FOOTER.WEBSITE_LINK(defaultProps.testIdInstanceSuffix)
    )
    expect(link).toBeInTheDocument()
    expect(link).not.toBeDisabled()
    expect(link).toHaveAttribute('href', schemedWebsite)
    expect(link).toHaveTextContent('Visit Website')
    expect(ensureExternalUrlScheme).toHaveBeenCalledWith(website)
  })

  it('renders an active link if websiteUrl with http is provided', () => {
    const website = 'http://testgym.com'
    vi.mocked(ensureExternalUrlScheme).mockReturnValue(website)

    render(<GymFooter {...defaultProps} websiteUrl={website} />)
    const link = screen.getByTestId(
      GymCardTestIds.FOOTER.WEBSITE_LINK(defaultProps.testIdInstanceSuffix)
    )
    expect(link).toHaveAttribute('href', website)
    expect(ensureExternalUrlScheme).toHaveBeenCalledWith(website)
  })

  it('uses provided data-testid for root when prop is passed', () => {
    const customRootId = 'custom-footer-root-explicit'
    render(
      <GymFooter
        {...defaultProps}
        websiteUrl="example.com"
        data-testid={customRootId}
      />
    )
    expect(screen.getByTestId(customRootId)).toBeInTheDocument()
  })

  it('defaults root data-testid using testIdInstanceSuffix when data-testid prop is not provided', () => {
    render(<GymFooter {...defaultProps} websiteUrl="example.com" />)
    expect(
      screen.getByTestId(
        GymCardTestIds.FOOTER.ROOT(defaultProps.testIdInstanceSuffix)
      )
    ).toBeInTheDocument()
  })

  it('sets correct aria-label and title for active link', () => {
    const website = 'testgym.com'
    render(<GymFooter {...defaultProps} websiteUrl={website} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute(
      'aria-label',
      `Visit website for ${defaultProps.gymName}`
    )
    expect(link).toHaveAttribute(
      'title',
      `Visit website for ${defaultProps.gymName}`
    )
  })

  it('sets correct aria-label and title for disabled button', () => {
    render(<GymFooter {...defaultProps} websiteUrl={undefined} />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute(
      'aria-label',
      `No website available for ${defaultProps.gymName}`
    )
    expect(button).toHaveAttribute(
      'title',
      `No website available for ${defaultProps.gymName}`
    )
  })
})
