import { render } from 'vitest-browser-react'
import { userEvent, page } from 'vitest/browser'
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

describe('EventCard (browser)', () => {
  it('given a card, when a child link gains focus, then :focus-within matches', async () => {
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

  it('given a focused card, when focus leaves, then :focus-within clears', async () => {
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
    ;(document.activeElement as HTMLElement | null)?.blur()
    expect(card.matches(':focus-within')).toBe(false)
  })

  it('given no event URL, when tabbing, then the disabled button is skipped', async () => {
    const screen = await render(
      <EventCard
        event={MOCK_EVENT_NO_URL}
        data-testid={EventsPageTestIds.LIST_ITEM}
      />
    )

    const disabledButton = screen.getByTestId(EventCardTestIds.BUTTON).element()
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

  it('given no event URL, when tabbing in, then the map link gains focus', async () => {
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

  it('given a card, when a link is focused via Tab, then :focus-visible matches', async () => {
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
