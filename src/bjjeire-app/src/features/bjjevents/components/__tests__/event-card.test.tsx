import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventCard } from '../event-card/event-card'
import { MOCK_EVENT_FULL, MOCK_EVENT_NO_URL } from './mocks/bjjevent.mocks'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'

describe('EventCard Component', () => {
  describe('Positive Scenarios', () => {
    it('should render all sections with correct content for a full event object', () => {
      render(
        <EventCard
          event={MOCK_EVENT_FULL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      const card = screen.getByTestId(EventsPageTestIds.LIST_ITEM)

      const name = within(card).getByRole('heading', {
        name: new RegExp(`event name: ${MOCK_EVENT_FULL.name}`, 'i'),
        level: 3,
      })
      const county = within(card).getByText('Dublin County', {
        selector: 'span',
      })
      const addressLink = within(card).getByRole('link', {
        name: new RegExp(
          `view ${MOCK_EVENT_FULL.name} location on google maps`,
          'i'
        ),
      })
      const infoLink = within(card).getByRole('link', {
        name: /get more information about/i,
      })

      expect(name).toHaveTextContent(MOCK_EVENT_FULL.name)
      expect(county).toBeInTheDocument()
      expect(addressLink).toBeInTheDocument()
      expect(infoLink).toBeInTheDocument()
    })
  })

  describe('Negative Scenarios', () => {
    it('should render a disabled button when the event has no URL', () => {
      render(
        <EventCard
          event={MOCK_EVENT_NO_URL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      const card = screen.getByTestId(EventsPageTestIds.LIST_ITEM)
      const button = within(card).getByRole('button', {
        name: /no information available for/i,
      })

      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Information Unavailable')
    })
  })

  describe('Edge Cases', () => {
    it('should render the map link with correct coordinates and security attributes', () => {
      render(
        <EventCard
          event={MOCK_EVENT_FULL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      const card = screen.getByTestId(EventsPageTestIds.LIST_ITEM)
      const mapLink = within(card).getByRole('link', {
        name: new RegExp(
          `view ${MOCK_EVENT_FULL.name} location on google maps`,
          'i'
        ),
      })
      const [lng, lat] = MOCK_EVENT_FULL.location.coordinates.coordinates

      expect(mapLink).toHaveAttribute(
        'href',
        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      )
      expect(mapLink).toHaveAttribute('target', '_blank')
      expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })
})
