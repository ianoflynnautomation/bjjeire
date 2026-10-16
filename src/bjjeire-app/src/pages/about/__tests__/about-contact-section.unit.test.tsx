import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AboutContactSection } from '../about-contact-section'
import { AboutContactTestIds } from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'
import { env } from '@/config/env'

vi.mock('@/config/env', () => ({
  env: {
    CONTACT_EMAIL: 'info@bjj-eire.com',
    SOCIAL_INSTAGRAM_URL: 'https://instagram.com/bjjeire',
    SOCIAL_FACEBOOK_URL: 'https://facebook.com/bjjeire',
  },
}))

describe('AboutContactSection', () => {
  it('given the contact section, when it renders, then the contact title and intro text are shown', () => {
    render(<AboutContactSection />)

    expect(
      screen.getByRole('heading', { name: uiContent.about.contactTitle })
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(AboutContactTestIds.PARAGRAPH_TEXT)
    ).toHaveTextContent(uiContent.about.contactPrefix)
  })

  it('given the contact section, when it renders, then the email link points to the contact address with an accessible label', () => {
    render(<AboutContactSection />)

    const emailLink = screen.getByTestId(AboutContactTestIds.EMAIL_LINK)
    expect(emailLink.tagName).toBe('A')
    expect(emailLink).toHaveAttribute('href', `mailto:${env.CONTACT_EMAIL}`)
    expect(emailLink).toHaveAttribute(
      'aria-label',
      `${uiContent.about.contactEmailAriaPrefix} ${env.CONTACT_EMAIL}`
    )
    expect(emailLink).toHaveTextContent(env.CONTACT_EMAIL)
  })

  it('given instagram and facebook urls, when the contact section renders, then each platform links to its own url', () => {
    render(<AboutContactSection />)

    expect(
      screen.getByRole('link', { name: 'View on Instagram' })
    ).toHaveAttribute('href', 'https://instagram.com/bjjeire')
    expect(
      screen.getByRole('link', { name: 'View on Facebook' })
    ).toHaveAttribute('href', 'https://facebook.com/bjjeire')
    expect(
      screen.queryByRole('link', { name: 'View on X' })
    ).not.toBeInTheDocument()
  })
})
