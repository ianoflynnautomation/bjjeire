import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventCard } from '../event-card/event-card'
import { MOCK_EVENT_FULL } from './mocks/bjjevent.mocks'
import { EventsPageTestIds } from '@/constants/eventDataTestIds'

function renderCard(): HTMLElement {
  render(
    <EventCard
      event={MOCK_EVENT_FULL}
      data-testid={EventsPageTestIds.LIST_ITEM}
    />
  )
  return screen.getByTestId(EventsPageTestIds.LIST_ITEM)
}

describe('EventCard', () => {
  it('given an event with full details, when the card renders, then header, map link and info link are composed', () => {
    const card = renderCard()

    expect(
      within(card).getByRole('heading', {
        name: new RegExp(MOCK_EVENT_FULL.name, 'i'),
        level: 3,
      })
    ).toBeInTheDocument()
    expect(
      within(card).getByRole('link', {
        name: new RegExp(
          `view ${MOCK_EVENT_FULL.name} location on google maps`,
          'i'
        ),
      })
    ).toBeInTheDocument()
    expect(
      within(card).getByRole('link', {
        name: /get more information about/i,
      })
    ).toBeInTheDocument()
  })
})
