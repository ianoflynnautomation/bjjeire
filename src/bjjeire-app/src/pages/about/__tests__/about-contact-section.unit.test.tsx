import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AboutContactSection } from '../about-contact-section'
import { AboutContactTestIds } from '@/constants/aboutDataTestIds'
import { uiContent } from '@/config/ui-content'
import { env } from '@/config/env'

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
      `Send an email to ${env.CONTACT_EMAIL}`
    )
    expect(emailLink).toHaveTextContent(env.CONTACT_EMAIL)
  })
})
