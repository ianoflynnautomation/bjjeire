import { render } from 'vitest-browser-react'
import { userEvent, page } from '@vitest/browser/context'
import { describe, it, expect } from 'vitest'
import { EventCard } from '../event-card/event-card'
import {
  MOCK_EVENT_FULL,
  MOCK_EVENT_MINIMAL,
  MOCK_EVENT_NO_URL,
} from './mocks/bjjevent.mocks'
import {
  EventsPageTestIds,
  EventCardTestIds,
} from '@/constants/eventDataTestIds'

// These tests verify browser-native behaviors that jsdom cannot reliably model:
// 1. :focus-within pseudo-class — the browser computes this from the real focus state
// 2. disabled attribute removes element from the Tab sequence natively
//
// Each test clicks document.body first to activate the page in Playwright headless —
// keyboard events (Tab) are only routed after at least one interaction.

describe('EventCard (browser)', () => {
  describe(':focus-within pseudo-class', () => {
    it('card matches :focus-within when a child link receives keyboard focus', async () => {
      const screen = await render(
        <EventCard
          event={MOCK_EVENT_FULL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )
      const card = screen.getByTestId(EventsPageTestIds.LIST_ITEM).element()

      await page.elementLocator(document.body).click()
      expect(card.matches(':focus-within')).toBe(false)

      await userEvent.tab()
      expect(card.matches(':focus-within')).toBe(true)
    })

    it('card no longer matches :focus-within after focus leaves', async () => {
      const screen = await render(
        <EventCard
          event={MOCK_EVENT_FULL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )
      const card = screen.getByTestId(EventsPageTestIds.LIST_ITEM).element()

      await page.elementLocator(document.body).click()
      await userEvent.tab()
      expect(card.matches(':focus-within')).toBe(true)

      for (let i = 0; i < 10; i++) {
        await userEvent.tab()
        if (!card.matches(':focus-within')) {
          break
        }
      }
      expect(card.matches(':focus-within')).toBe(false)
    })
  })

  describe('Tab sequence', () => {
    it('disabled info button is not in the Tab sequence when event has no URL', async () => {
      const screen = await render(
        <EventCard
          event={MOCK_EVENT_NO_URL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      const disabledButton = screen
        .getByTestId(EventCardTestIds.BUTTON)
        .element()
      expect(disabledButton.tagName).toBe('BUTTON')
      await expect
        .element(screen.getByTestId(EventCardTestIds.BUTTON))
        .toBeDisabled()

      await page.elementLocator(document.body).click()
      let tabCount = 0
      while (tabCount < 10) {
        await userEvent.tab()
        expect(document.activeElement).not.toBe(disabledButton)
        if (document.activeElement === document.body) {
          break
        }
        tabCount++
      }
    })

    it('map link IS in the Tab sequence when the event has no URL', async () => {
      const screen = await render(
        <EventCard
          event={MOCK_EVENT_MINIMAL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      await page.elementLocator(document.body).click()
      await userEvent.tab()
      expect(document.activeElement).toBe(
        screen.getByTestId(EventCardTestIds.ADDRESS_LINK).element()
      )
    })
  })

  describe('Keyboard focus indicator', () => {
    it('focused link matches :focus-visible after keyboard Tab', async () => {
      await render(
        <EventCard
          event={MOCK_EVENT_FULL}
          data-testid={EventsPageTestIds.LIST_ITEM}
        />
      )

      await page.elementLocator(document.body).click()
      await userEvent.tab()
      const focused = document.activeElement as HTMLElement

      expect(focused.tagName).toBe('A')
      expect(focused.matches(':focus-visible')).toBe(true)
    })
  })
})
