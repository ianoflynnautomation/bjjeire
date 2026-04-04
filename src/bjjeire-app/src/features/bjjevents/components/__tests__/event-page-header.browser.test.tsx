import { render } from 'vitest-browser-react'
import { describe, it, expect } from 'vitest'
import { EventsPageHeader } from '../event-page-header'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'

describe('EventsPageHeader (browser)', () => {
  it('renders the correct title in a real browser DOM', async () => {
    const screen = await render(<EventsPageHeader countyName="Dublin" />)
    await expect
      .element(screen.getByTestId(EventsPageTestIds.HEADER_TITLE))
      .toHaveTextContent('BJJ Events in Dublin')
  })

  it('renders the event count badge with singular label', async () => {
    const screen = await render(<EventsPageHeader totalEvents={1} />)
    await expect
      .element(screen.getByTestId(EventsPageTestIds.HEADER_TOTAL))
      .toHaveTextContent('Found 1 event.')
  })

  it('hides the count badge when totalEvents is 0', async () => {
    const screen = await render(<EventsPageHeader totalEvents={0} />)
    await expect
      .element(screen.getByTestId(EventsPageTestIds.HEADER_TOTAL))
      .not.toBeInTheDocument()
  })
})
