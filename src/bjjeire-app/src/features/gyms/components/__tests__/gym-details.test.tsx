import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymDetails } from '../gym-card/gym-details'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'

describe('GymDetails', () => {
  it('renders links and metadata for full gym details', () => {
    render(<GymDetails gym={MOCK_GYM_FULL} />)

    expect(
      screen.getByRole('link', { name: /view timetable/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: new RegExp(MOCK_GYM_FULL.location.address, 'i'),
      })
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /view on/i })).toHaveLength(4)
  })

  it('hides optional sections when data is missing', () => {
    render(<GymDetails gym={MOCK_GYM_MINIMAL} />)

    expect(
      screen.getByRole('link', {
        name: new RegExp(MOCK_GYM_MINIMAL.location.address, 'i'),
      })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /view timetable/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /affiliated with/i })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /view on/i })).not.toBeInTheDocument()
  })
})
