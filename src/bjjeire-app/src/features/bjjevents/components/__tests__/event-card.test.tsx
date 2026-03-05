import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventCard } from '../event-card/event-card'
import {
  MOCK_EVENT_FULL,
  MOCK_EVENT_MINIMAL,
  MOCK_EVENT_NO_URL,
} from './mocks/bjjevent.mocks'
import { EventsPageTestIds, EventCardTestIds } from '@/constants/eventDataTestIds'

describe('EventCard Component', () => {
  describe('Positive Scenarios', () => {
    it('should render all sections with correct content for a full event object', () => {
      render(<EventCard event={MOCK_EVENT_FULL} data-testid={EventsPageTestIds.LIST_ITEM} />)

      const card = screen.getByTestId(EventsPageTestIds.LIST_ITEM)

      const name = within(card).getByRole('heading', {
        name: new RegExp(`event name: ${MOCK_EVENT_FULL.name}`, 'i'),
        level: 3,
      })
      const county = within(card).getByTestId(EventCardTestIds.COUNTY)
      const addressLink = within(card).getByTestId(EventCardTestIds.ADDRESS_LINK)
      const infoLink = within(card).getByRole('link', {
        name: /get more information about/i,
      })

      expect(name).toHaveTextContent(MOCK_EVENT_FULL.name)
      expect(county).toHaveTextContent('Dublin County')
      expect(addressLink).toBeInTheDocument()
      expect(infoLink).toBeInTheDocument()
    })
  })

  describe('Negative Scenarios', () => {
    it('should render a disabled button when the event has no URL', () => {
      render(<EventCard event={MOCK_EVENT_NO_URL} data-testid={EventsPageTestIds.LIST_ITEM} />)

      const card = screen.getByTestId(EventsPageTestIds.LIST_ITEM)
      const button = within(card).getByRole('button', {
        name: /no information available for/i,
      })

      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Information Unavailable')
    })

    it('should render a disabled button when eventUrl is an empty string', () => {
      render(<EventCard event={MOCK_EVENT_MINIMAL} data-testid={EventsPageTestIds.LIST_ITEM} />)

      const card = screen.getByTestId(EventsPageTestIds.LIST_ITEM)
      const button = within(card).getByRole('button', {
        name: /no information available for cork bjj seminar/i,
      })

      expect(button).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should use the default test ID when none is provided', () => {
      render(<EventCard event={MOCK_EVENT_FULL} />)

      expect(screen.getByTestId(EventsPageTestIds.LIST_ITEM)).toBeInTheDocument()
    })

    it('should render with a custom data-testid', () => {
      render(<EventCard event={MOCK_EVENT_FULL} data-testid="custom-card-id" />)

      expect(screen.getByTestId('custom-card-id')).toBeInTheDocument()
    })
  })
})
