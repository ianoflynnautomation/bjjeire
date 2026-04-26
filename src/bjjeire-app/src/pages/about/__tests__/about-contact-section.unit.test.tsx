import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AboutContactSection } from '../about-contact-section'
import { AboutContactTestIds } from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'
import { env } from '@/config/env'

describe('AboutContactSection', () => {
  it('renders the section with the correct test ID', () => {
    render(<AboutContactSection />)

    expect(screen.getByTestId(AboutContactTestIds.SECTION)).toBeInTheDocument()
  })

  it('renders the contact title as a heading', () => {
    render(<AboutContactSection />)

    expect(
      screen.getByRole('heading', { name: uiContent.about.contactTitle })
    ).toBeInTheDocument()
  })

  it('renders the contact paragraph with email prefix text', () => {
    render(<AboutContactSection />)

    expect(
      screen.getByTestId(AboutContactTestIds.PARAGRAPH_TEXT)
    ).toHaveTextContent(uiContent.about.contactPrefix)
  })

  it('renders the email link with correct href and aria-label', () => {
    render(<AboutContactSection />)

    const emailLink = screen.getByTestId(AboutContactTestIds.EMAIL_LINK)
    expect(emailLink.tagName).toBe('A')
    expect(emailLink).toHaveAttribute('href', `mailto:${env.CONTACT_EMAIL}`)
    expect(emailLink).toHaveAttribute(
      'aria-label',
      `Send an email to ${env.CONTACT_EMAIL}`
    )
    expect(emailLink).toHaveTextContent(env.CONTACT_EMAIL)
  })

  it.skip('renders the social media links section', () => {
    render(<AboutContactSection />)

    expect(
      screen.getByTestId(AboutContactTestIds.SOCIAL_LINKS)
    ).toBeInTheDocument()
  })
})
