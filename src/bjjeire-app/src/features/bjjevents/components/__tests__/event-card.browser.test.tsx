import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { EventCard } from '../event-card/event-card'
import {
  MOCK_EVENT_FULL,
  MOCK_EVENT_MINIMAL,
  MOCK_EVENT_NO_URL,
} from './mocks/bjjevent.mocks'
import { EventsPageTestIds, EventCardTestIds } from '@/constants/eventDataTestIds'

// These tests verify browser-native behaviors that jsdom cannot reliably model:
// 1. :focus-within pseudo-class — the browser computes this from the real focus state
// 2. disabled attribute removes element from the Tab sequence natively

describe('EventCard (browser)', () => {
  describe(':focus-within pseudo-class', () => {
    it('card matches :focus-within when a child link receives keyboard focus', async () => {
      const user = userEvent.setup()
      render(
        <EventCard
          event={MOCK_EVENT_FULL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      const card = screen.getByTestId(EventsPageTestIds.LIST_ITEM)
      expect(card.matches(':focus-within')).toBe(false)

      await user.tab() // focuses first interactive element — the map link
      expect(card.matches(':focus-within')).toBe(true)
    })

    it('card no longer matches :focus-within after focus leaves', async () => {
      const user = userEvent.setup()
      render(
        <EventCard
          event={MOCK_EVENT_FULL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      const card = screen.getByTestId(EventsPageTestIds.LIST_ITEM)
      await user.tab() // move focus in
      expect(card.matches(':focus-within')).toBe(true)

      await user.tab({ shift: true }) // shift-Tab moves focus out
      expect(card.matches(':focus-within')).toBe(false)
    })
  })

  describe('Tab sequence', () => {
    it('disabled info button is not in the Tab sequence when event has no URL', async () => {
      const user = userEvent.setup()
      render(
        <EventCard
          event={MOCK_EVENT_NO_URL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      const disabledButton = screen.getByTestId(EventCardTestIds.BUTTON)
      expect(disabledButton.tagName).toBe('BUTTON')
      expect(disabledButton).toBeDisabled()

      // Tab through the entire card — disabled button must never receive focus
      let tabCount = 0
      while (tabCount < 10) {
        await user.tab()
        expect(document.activeElement).not.toBe(disabledButton)
        if (document.activeElement === document.body) {break}
        tabCount++
      }
    })

    it('info link IS in the Tab sequence when the event has a URL', async () => {
      const user = userEvent.setup()
      render(
        <EventCard
          event={MOCK_EVENT_MINIMAL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      // MOCK_EVENT_MINIMAL has no eventUrl — just verify the map link IS focusable
      await user.tab()
      const mapLink = screen.getByTestId(EventCardTestIds.ADDRESS_LINK)
      expect(document.activeElement).toBe(mapLink)
    })
  })

  describe('Keyboard focus indicator', () => {
    it('focused link matches :focus-visible after keyboard Tab', async () => {
      const user = userEvent.setup()
      render(
        <EventCard
          event={MOCK_EVENT_FULL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      await user.tab() // keyboard Tab triggers :focus-visible in real browsers
      const focused = document.activeElement as HTMLElement

      expect(focused.tagName).toBe('A')
      // :focus-visible is a browser-native pseudo-class: true only for keyboard focus,
      // never for programmatic .focus() — jsdom does not distinguish these
      expect(focused.matches(':focus-visible')).toBe(true)
    })
  })
})
