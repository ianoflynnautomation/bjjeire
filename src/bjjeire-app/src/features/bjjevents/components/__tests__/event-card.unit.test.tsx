import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventCard } from '../event-card/event-card'
import {
  MOCK_EVENT_FULL,
  MOCK_EVENT_NO_URL,
  location as mockLocation,
} from './mocks/bjjevent.mocks'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'

function renderCard(event = MOCK_EVENT_FULL): HTMLElement {
  render(<EventCard event={event} data-testid={EventsPageTestIds.LIST_ITEM} />)
  return screen.getByTestId(EventsPageTestIds.LIST_ITEM)
}

describe('EventCard', () => {
  it('given an event with full details, when the card renders, then it shows the name, county, map link and info link', () => {
    const card = renderCard(MOCK_EVENT_FULL)

    const name = within(card).getByRole('heading', {
      name: new RegExp(MOCK_EVENT_FULL.name, 'i'),
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

  it('given an event without a URL, when the card renders, then the info button is disabled', () => {
    const card = renderCard(MOCK_EVENT_NO_URL)

    const button = within(card).getByRole('button', {
      name: /no information available for/i,
    })

    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Information Unavailable')
  })

  it('given an event with coordinates, when the card renders, then the map link opens Google Maps safely in a new tab', () => {
    const card = renderCard(MOCK_EVENT_FULL)

    const mapLink = within(card).getByRole('link', {
      name: new RegExp(
        `view ${MOCK_EVENT_FULL.name} location on google maps`,
        'i'
      ),
    })
    const { latitude, longitude } = mockLocation.coordinates

    expect(mapLink).toHaveAttribute(
      'href',
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    )
    expect(mapLink).toHaveAttribute('target', '_blank')
    expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
