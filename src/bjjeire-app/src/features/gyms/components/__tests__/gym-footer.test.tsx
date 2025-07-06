import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GymFooter } from './../gym-card/gym-footer'

vi.unmock('../../../../utils/formattingUtils')

describe('GymFooter Component', () => {
  const defaultProps = {
    gymName: 'Test Gym Footer',
  }

  it.each([
    { websiteUrl: undefined, case: 'undefined' },
    { websiteUrl: '', case: 'an empty string' },
    { websiteUrl: '   ', case: 'only whitespace' },
  ])(
    'should render a disabled button when websiteUrl is $case',
    ({ websiteUrl }) => {
      render(<GymFooter {...defaultProps} websiteUrl={websiteUrl} />)

      const button = screen.getByRole('button', {
        name: /No website available for Test Gym Footer/i,
      })

      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    }
  )

  it('should render an active link with a correct href when websiteUrl is provided', () => {
    const website = 'testgym.com'
    render(<GymFooter {...defaultProps} websiteUrl={website} />)

    const link = screen.getByRole('link', {
      name: `Visit website for ${defaultProps.gymName}`,
    })

    expect(link).toBeInTheDocument()
    expect(link).not.toBeDisabled()
    expect(link).toHaveAttribute('href', 'https://testgym.com')
  })

  it('should set correct aria-label and title for the link', () => {
    render(<GymFooter {...defaultProps} websiteUrl="testgym.com" />)
    const link = screen.getByRole('link', {
      name: `Visit website for ${defaultProps.gymName}`,
    })

    expect(link).toHaveAttribute(
      'aria-label',
      `Visit website for ${defaultProps.gymName}`
    )
    expect(link).toHaveAttribute(
      'title',
      `Visit website for ${defaultProps.gymName}`
    )
  })

  it('should set correct aria-label and title for the disabled button', () => {
    render(<GymFooter {...defaultProps} websiteUrl={undefined} />)
    const button = screen.getByRole('button', {
      name: `No website available for ${defaultProps.gymName}`,
    })

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
