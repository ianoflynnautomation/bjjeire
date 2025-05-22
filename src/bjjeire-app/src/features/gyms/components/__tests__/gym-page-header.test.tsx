import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsPageHeader } from './../gym-page-header'
import { GymsPageHeaderTestIds } from '../../../../constants/gymDataTestIds'

describe('GymsPageHeader Component', () => {
  const defaultTestId = GymsPageHeaderTestIds.ROOT()

  it('renders "All BJJ Gyms" title by default"', () => {
    render(<GymsPageHeader data-testid={defaultTestId} />)
    expect(screen.getByTestId(GymsPageHeaderTestIds.TITLE())).toHaveTextContent(
      'All BJJ Gyms'
    )
  })

  it('renders "All BJJ Gyms" title if countyName is "all"', () => {
    render(<GymsPageHeader countyName="all" data-testid={defaultTestId} />)
    expect(screen.getByTestId(GymsPageHeaderTestIds.TITLE())).toHaveTextContent(
      'All BJJ Gyms'
    )
  })

  it('renders title with specific county name', () => {
    const county = 'Dublin'
    render(<GymsPageHeader countyName={county} data-testid={defaultTestId} />)
    expect(screen.getByTestId(GymsPageHeaderTestIds.TITLE())).toHaveTextContent(
      `BJJ Gyms in ${county}`
    )
  })

  it('does not render total gyms count if totalGyms is undefined', () => {
    render(<GymsPageHeader data-testid={defaultTestId} />)
    expect(
      screen.queryByTestId(GymsPageHeaderTestIds.TOTAL())
    ).not.toBeInTheDocument()
  })

  it('does not render total gyms count if totalGyms is 0', () => {
    render(<GymsPageHeader totalGyms={0} data-testid={defaultTestId} />)
    expect(
      screen.queryByTestId(GymsPageHeaderTestIds.TOTAL())
    ).not.toBeInTheDocument()
  })

  it('renders correct total gyms count for 1 gym', () => {
    render(<GymsPageHeader totalGyms={1} data-testid={defaultTestId} />)
    expect(screen.getByTestId(GymsPageHeaderTestIds.TOTAL())).toHaveTextContent(
      'Found 1 gym.'
    )
  })

  it('renders correct total gyms count for multiple gyms', () => {
    render(<GymsPageHeader totalGyms={5} data-testid={defaultTestId} />)
    expect(screen.getByTestId(GymsPageHeaderTestIds.TOTAL())).toHaveTextContent(
      'Found 5 gyms.'
    )
  })

  it('applies the root data-testid', () => {
    const customId = 'my-page-header'
    render(<GymsPageHeader data-testid={customId} />)
    expect(screen.getByTestId(customId)).toBeInTheDocument()
  })
})
