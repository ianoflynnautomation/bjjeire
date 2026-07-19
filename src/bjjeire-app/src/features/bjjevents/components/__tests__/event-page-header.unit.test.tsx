import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventsPageHeader } from '../event-page-header'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'

describe('EventsPageHeader', () => {
  describe('Title', () => {
    it.each([
      { countyName: undefined, case: 'no county' },
      { countyName: 'all', case: 'county "all"' },
      { countyName: 'All', case: 'county "All" (case-insensitive)' },
    ])(
      'given $case, when the header renders, then the title is "All BJJ Events"',
      ({ countyName }) => {
        render(<EventsPageHeader countyName={countyName} />)
        expect(
          screen.getByTestId(EventsPageTestIds.HEADER_TITLE)
        ).toHaveTextContent('All BJJ Events')
      }
    )

    it('given a specific county, when the header renders, then the title names the county', () => {
      render(<EventsPageHeader countyName="Dublin" />)
      expect(
        screen.getByTestId(EventsPageTestIds.HEADER_TITLE)
      ).toHaveTextContent('BJJ Events in Dublin')
    })
  })

  describe('Event count badge', () => {
    it('given a single result, when the header renders, then the count uses the singular label', () => {
      render(<EventsPageHeader totalEvents={1} />)
      expect(
        screen.getByTestId(EventsPageTestIds.HEADER_TOTAL)
      ).toHaveTextContent('Found 1 event.')
    })

    it('given multiple results, when the header renders, then the count uses the plural label', () => {
      render(<EventsPageHeader totalEvents={5} />)
      expect(
        screen.getByTestId(EventsPageTestIds.HEADER_TOTAL)
      ).toHaveTextContent('Found 5 events.')
    })

    it.each([
      { totalEvents: 0, case: 'zero results' },
      { totalEvents: undefined, case: 'an unknown result count' },
    ])(
      'given $case, when the header renders, then the count badge is hidden',
      ({ totalEvents }) => {
        render(<EventsPageHeader totalEvents={totalEvents} />)
        expect(
          screen.queryByTestId(EventsPageTestIds.HEADER_TOTAL)
        ).not.toBeInTheDocument()
      }
    )
  })
})
