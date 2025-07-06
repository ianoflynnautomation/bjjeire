import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsList } from './../gym-list'
import { MOCK_GYM_FULL, MOCK_GYM_MINIMAL } from './mocks/gym.mock'
import { GymDto } from '../../../../types/gyms'

describe('GymsList Component', () => {
  it('should render loading state correctly', () => {
    render(<GymsList isLoading={true} />)

    expect(screen.getByTestId('gyms-list-loading')).toBeInTheDocument()
  })

  it('should render error state correctly', () => {
    render(<GymsList error={new Error('Failed to load gyms')} />)
    expect(screen.getByText(/Could not load gyms/i)).toBeInTheDocument()
  })

  it('should render empty state if the gyms array is empty', () => {
    render(<GymsList gyms={[]} />)
    expect(screen.getByText(/No gyms found/i)).toBeInTheDocument()
  })

  it('should render empty state if the gyms array is undefined', () => {
    render(<GymsList gyms={undefined} />)
    expect(screen.getByText(/No gyms found/i)).toBeInTheDocument()
  })

  it('should render a list of GymCards when gyms are provided', () => {
    const gyms: GymDto[] = [MOCK_GYM_FULL, MOCK_GYM_MINIMAL]
    render(<GymsList gyms={gyms} />)

    expect(
      screen.getByRole('heading', {
        name: /Elite Fighters Academy/i,
        level: 3,
      })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: /Community BJJ Club/i,
        level: 3,
      })
    ).toBeInTheDocument()

    expect(screen.queryByText(/No gyms found/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId('gyms-list-loading')).not.toBeInTheDocument()
  })
})