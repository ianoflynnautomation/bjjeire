import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GymsPageHeader } from './../gym-page-header'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'

describe('GymsPageHeader', () => {
  describe('Title', () => {
    it.each([
      { countyName: undefined, case: 'no county' },
      { countyName: 'all', case: 'county "all"' },
      { countyName: 'All', case: 'county "All" (case-insensitive)' },
    ])(
      'given $case, when the header renders, then the title is "All BJJ Gyms"',
      ({ countyName }) => {
        render(<GymsPageHeader countyName={countyName} />)
        expect(
          screen.getByRole('heading', { name: 'All BJJ Gyms', level: 2 })
        ).toBeInTheDocument()
      }
    )

    it('given a specific county, when the header renders, then the title names the county', () => {
      const county = 'Dublin'
      render(<GymsPageHeader countyName={county} />)
      expect(
        screen.getByRole('heading', { name: `BJJ Gyms in ${county}`, level: 2 })
      ).toBeInTheDocument()
    })
  })

  describe('Gym count', () => {
    it.each([
      { totalGyms: undefined, case: 'an unknown result count' },
      { totalGyms: 0, case: 'zero results' },
    ])(
      'given $case, when the header renders, then the count is hidden',
      ({ totalGyms }) => {
        render(<GymsPageHeader totalGyms={totalGyms} />)

        expect(
          screen.queryByTestId(GymsPageTestIds.HEADER_TOTAL)
        ).not.toBeInTheDocument()
      }
    )

    it('given a single result, when the header renders, then the count uses the singular label', () => {
      render(<GymsPageHeader totalGyms={1} />)
      expect(screen.getByText('Found 1 gym.')).toBeInTheDocument()
    })

    it('given multiple results, when the header renders, then the count uses the plural label', () => {
      render(<GymsPageHeader totalGyms={5} />)
      expect(screen.getByText('Found 5 gyms.')).toBeInTheDocument()
    })
  })
})
