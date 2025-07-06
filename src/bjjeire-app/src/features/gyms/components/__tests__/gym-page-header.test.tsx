import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsPageHeader } from './../gym-page-header'

describe('GymsPageHeader Component', () => {
  it('should render "All BJJ Gyms" as the main heading by default', () => {
    render(<GymsPageHeader />)
    expect(
      screen.getByRole('heading', { name: 'All BJJ Gyms' })
    ).toBeInTheDocument()
  })

  it('should render "All BJJ Gyms" as the main heading if countyName is "all"', () => {
    render(<GymsPageHeader countyName="all" />)
    expect(
      screen.getByRole('heading', { name: 'All BJJ Gyms' })
    ).toBeInTheDocument()
  })

  it('should render a specific county name in the main heading', () => {
    const county = 'Dublin'
    render(<GymsPageHeader countyName={county} />)
    expect(
      screen.getByRole('heading', { name: `BJJ Gyms in ${county}` })
    ).toBeInTheDocument()
  })

  it('should not render a total count if totalGyms is undefined or 0', () => {

    const { rerender } = render(<GymsPageHeader />)

    expect(screen.queryByText(/Found \d+ gym/)).not.toBeInTheDocument()

    rerender(<GymsPageHeader totalGyms={0} />)
    expect(screen.queryByText(/Found \d+ gym/)).not.toBeInTheDocument()
  })

  it('should render the correct total count for a single gym', () => {
    render(<GymsPageHeader totalGyms={1} />)
    expect(screen.getByText('Found 1 gym.')).toBeInTheDocument()
  })

  it('should render the correct total count for multiple gyms', () => {
    render(<GymsPageHeader totalGyms={5} />)
    expect(screen.getByText('Found 5 gyms.')).toBeInTheDocument()
  })

  it('should still apply a custom data-testid if one is provided', () => {
    const customId = 'my-custom-page-header'
    render(<GymsPageHeader data-testid={customId} />)
    expect(screen.getByTestId(customId)).toBeInTheDocument()
  })
})
