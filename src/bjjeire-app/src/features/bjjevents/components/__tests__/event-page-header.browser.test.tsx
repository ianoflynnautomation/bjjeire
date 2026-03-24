import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventsPageHeader } from '../event-page-header'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'

describe('EventsPageHeader (browser)', () => {
  it('renders the correct title in a real browser DOM', () => {
    render(<EventsPageHeader countyName="Dublin" />)
    expect(
      screen.getByTestId(EventsPageTestIds.HEADER_TITLE)
    ).toHaveTextContent('BJJ Events in Dublin')
  })

  it('renders the event count badge with singular label', () => {
    render(<EventsPageHeader totalEvents={1} />)
    expect(
      screen.getByTestId(EventsPageTestIds.HEADER_TOTAL)
    ).toHaveTextContent('Found 1 event.')
  })

  it('hides the count badge when totalEvents is 0', () => {
    render(<EventsPageHeader totalEvents={0} />)
    expect(
      screen.queryByTestId(EventsPageTestIds.HEADER_TOTAL)
    ).not.toBeInTheDocument()
  })
})
