import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GymCard } from './../gym-card/gym-card'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'

describe('GymCard Component', () => {
  it('should render all sections with correct content for a full gym object', () => {
    render(<GymCard gym={MOCK_GYM_FULL} />)

    expect(
      screen.getByRole('heading', {
        name: /Elite Fighters Academy/i,
        level: 3,
      })
    ).toBeInTheDocument()

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Dublin County')).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: /123 Main Street/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Affiliated with/i })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: /Visit Website/i })
    ).toBeInTheDocument()
  })

  it('should render correctly with minimal gym data', () => {
    render(<GymCard gym={MOCK_GYM_MINIMAL} />)

    expect(
      screen.getByRole('heading', {
        name: /Community BJJ Club/i,
        level: 3,
      })
    ).toBeInTheDocument()

    expect(screen.queryByText(/Affiliated with/i)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Visit Website/i })
    ).not.toBeInTheDocument()
  })
})
