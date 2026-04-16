import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventsPageHeader } from '../event-page-header'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'

describe('EventsPageHeader Component', () => {
  describe('Title', () => {
    it('shows "All BJJ Events" when no county is provided', () => {
      render(<EventsPageHeader />)
      expect(
        screen.getByTestId(EventsPageTestIds.HEADER_TITLE)
      ).toHaveTextContent('All BJJ Events')
    })

    it('shows "All BJJ Events" when county is "all"', () => {
      render(<EventsPageHeader countyName="all" />)
      expect(
        screen.getByTestId(EventsPageTestIds.HEADER_TITLE)
      ).toHaveTextContent('All BJJ Events')
    })

    it('shows "All BJJ Events" when county is "All" (case-insensitive)', () => {
      render(<EventsPageHeader countyName="All" />)
      expect(
        screen.getByTestId(EventsPageTestIds.HEADER_TITLE)
      ).toHaveTextContent('All BJJ Events')
    })

    it('shows "BJJ Events in {county}" when a specific county is provided', () => {
      render(<EventsPageHeader countyName="Dublin" />)
      expect(
        screen.getByTestId(EventsPageTestIds.HEADER_TITLE)
      ).toHaveTextContent('BJJ Events in Dublin')
    })
  })

  describe('Event count badge', () => {
    it('shows singular "Found 1 event." for a single result', () => {
      render(<EventsPageHeader totalEvents={1} />)
      expect(
        screen.getByTestId(EventsPageTestIds.HEADER_TOTAL)
      ).toHaveTextContent('Found 1 event.')
    })

    it('shows plural "Found 5 events." for multiple results', () => {
      render(<EventsPageHeader totalEvents={5} />)
      expect(
        screen.getByTestId(EventsPageTestIds.HEADER_TOTAL)
      ).toHaveTextContent('Found 5 events.')
    })

    it('hides the count badge when totalEvents is 0', () => {
      render(<EventsPageHeader totalEvents={0} />)
      expect(
        screen.queryByTestId(EventsPageTestIds.HEADER_TOTAL)
      ).not.toBeInTheDocument()
    })

    it('hides the count badge when totalEvents is undefined', () => {
      render(<EventsPageHeader />)
      expect(
        screen.queryByTestId(EventsPageTestIds.HEADER_TOTAL)
      ).not.toBeInTheDocument()
    })
  })
})
