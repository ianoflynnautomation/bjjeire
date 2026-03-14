import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsPageHeader } from './../gym-page-header'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'

describe('GymsPageHeader Component', () => {
  describe('Title Rendering', () => {
    it('should render the default title when no countyName is provided', () => {
      render(<GymsPageHeader />)
      expect(
        screen.getByRole('heading', { name: 'All BJJ Gyms', level: 2 })
      ).toBeInTheDocument()
    })

    it('should render the default title if countyName is "all"', () => {
      render(<GymsPageHeader countyName="all" />)
      expect(
        screen.getByRole('heading', { name: 'All BJJ Gyms', level: 2 })
      ).toBeInTheDocument()
    })

    it('should render the default title if countyName is "All" (case-insensitive)', () => {
      render(<GymsPageHeader countyName="All" />)
      expect(
        screen.getByRole('heading', { name: 'All BJJ Gyms', level: 2 })
      ).toBeInTheDocument()
    })

    it('should render a county-specific title when a countyName is provided', () => {
      const county = 'Dublin'
      render(<GymsPageHeader countyName={county} />)
      expect(
        screen.getByRole('heading', { name: `BJJ Gyms in ${county}`, level: 2 })
      ).toBeInTheDocument()
    })
  })

  describe('Total Count Display', () => {
    it('should not render the total count element if totalGyms is undefined', () => {
      // Arrange
      const { queryByTestId } = render(<GymsPageHeader />)

      // Assert
      expect(
        queryByTestId(GymsPageTestIds.HEADER_TOTAL)
      ).not.toBeInTheDocument()
    })

    it('should not render the total count element if totalGyms is 0', () => {
      // Arrange
      const { queryByTestId } = render(<GymsPageHeader totalGyms={0} />)

      // Assert
      expect(
        queryByTestId(GymsPageTestIds.HEADER_TOTAL)
      ).not.toBeInTheDocument()
    })

    it('should render the correct singular text for a single gym', () => {
      const total = 1
      render(<GymsPageHeader totalGyms={total} />)
      expect(screen.getByText(`Found ${total} gym.`)).toBeInTheDocument()
    })

    it('should render the correct plural text for multiple gyms', () => {
      const total = 5
      render(<GymsPageHeader totalGyms={total} />)
      expect(screen.getByText(`Found ${total} gyms.`)).toBeInTheDocument()
    })
  })

  describe('Data Attributes', () => {
    it('should apply a custom data-testid to the root element if provided', () => {
      // Arrange
      const customId = 'my-custom-header'
      const { getByTestId } = render(<GymsPageHeader data-testid={customId} />)

      // Assert
      expect(getByTestId(customId)).toBeInTheDocument()
    })
  })
})
