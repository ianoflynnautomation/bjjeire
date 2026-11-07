import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import type { ReactElement, ReactNode } from 'react'
import { createEvent } from '@/testing/factories/event.factory'
import { EventMapTestIds } from '@/constants/eventDataTestIds'
import { contrast, over, parseColour, type Rgba } from '@/testing/contrast'
import type { BjjEventDto } from '@/types/event'
import { EventMap } from '../event-map'

// Tests never touch live OpenStreetMap. The fragment keeps z/x/y readable on each tile.
const BLANK_TILE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7#{z}/{x}/{y}'
const BROKEN_TILE = 'http://127.0.0.1:9/{z}/{x}/{y}.png'
// Leaflet fills {s} with a, b or c by tile position, so only the "a" tiles get a valid scheme.
const PARTLY_BROKEN_TILE = BLANK_TILE.replace('data:', 'dat{s}:')

// The venue doubles as the pin's name, so each event here has its own venue.
function eventAt(name: string, lng: number, lat: number): BjjEventDto {
  return createEvent({
    name,
    eventUrl: 'https://example.com/event',
    location: {
      address: `${name} Street`,
      venue: name,
      coordinates: { type: 'Point', coordinates: [lng, lat] },
    },
  })
}

const dublin = eventAt('Dublin BJJ', -6.26, 53.33)
const galway = eventAt('Galway BJJ', -9.05, 53.27)
const belfast = eventAt('Belfast BJJ', -5.93, 54.6)
const cork = eventAt('Cork BJJ', -8.47, 51.9)

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <MemoryRouter initialEntries={['/events?view=map&county=Cork']}>
      {children}
    </MemoryRouter>
  )
}

/** The element for a selector, or a clear failure. */
function elementFor(selector: string): Element {
  const element = document.querySelector(selector)
  if (!element) {
    throw new Error(`no element for ${selector}`)
  }
  return element
}

function centre(el: Element): { x: number; y: number } {
  const { left, top, width, height } = el.getBoundingClientRect()
  return { x: left + width / 2, y: top + height / 2 }
}

function pinCentre(name: string): { x: number; y: number } {
  const el = document.querySelector(`[title="${name}"]`)
  if (!el) {
    throw new Error(`no pin for ${name}`)
  }
  return centre(el)
}

function tileZoom(): number {
  const src = document.querySelector('img.leaflet-tile')?.getAttribute('src')
  return Number(src?.split('#')[1]?.split('/')[0])
}

function mapRect(): DOMRect {
  return page
    .getByTestId(EventMapTestIds.ROOT)
    .element()
    .getBoundingClientRect()
}

function isInsideMap({ x, y }: { x: number; y: number }): boolean {
  const { left, right, top, bottom } = mapRect()
  return x >= left && x <= right && y >= top && y <= bottom
}

afterEach(async () => {
  vi.restoreAllMocks()
  await page.viewport(1280, 800)
})

describe('EventMap (browser)', () => {
  const leinster = {
    address: '2 Mat Lane, Dublin 8',
    venue: 'Leinster Grappling HQ',
    coordinates: {
      type: 'Point' as const,
      coordinates: [-6.2889, 53.3382] as [number, number],
    },
  }

  it('AC-EVT-010: given filters change the events at a venue, when the map updates, then the pin name follows', async () => {
    const openMat = createEvent({
      name: 'Leinster Community Open Mat',
      location: leinster,
    })
    const seminar = createEvent({
      name: 'Dublin No-Gi Seminar',
      location: leinster,
    })
    const screen = await render(
      <EventMap
        events={[openMat, seminar]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      { wrapper: Wrapper }
    )
    await expect
      .element(
        page.getByRole('button', { name: 'Leinster Grappling HQ, 2 events' })
      )
      .toBeVisible()

    await screen.rerender(
      <EventMap events={[seminar]} hasFilters tileUrl={BLANK_TILE} />
    )
    await expect
      .element(
        page.getByRole('button', { name: 'Leinster Grappling HQ', exact: true })
      )
      .toBeVisible()

    await screen.rerender(
      <EventMap
        events={[openMat, seminar]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />
    )
    await expect
      .element(
        page.getByRole('button', { name: 'Leinster Grappling HQ, 2 events' })
      )
      .toBeVisible()
  })

  it('AC-EVT-016: given a popup was closed with Escape, when the pin is opened again by keyboard, then focus moves into the popup again', async () => {
    await render(
      <EventMap
        events={[dublin, galway]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      {
        wrapper: Wrapper,
      }
    )
    const pin = page.getByRole('button', { name: 'Dublin BJJ' })
    await expect.element(pin).toBeVisible()
    ;(pin.element() as HTMLElement).focus()

    for (const key of ['{Enter}', ' ']) {
      await userEvent.keyboard(key)
      const popup = page.getByTestId(EventMapTestIds.POPUP)
      await expect.element(popup).toBeVisible()
      await expect.poll(() => document.activeElement).toBe(popup.element())
      await userEvent.keyboard('{Escape}')
      await expect.element(popup).not.toBeInTheDocument()
      expect(document.activeElement).toBe(pin.element())
    }
  })

  it('AC-EVT-016: given a short map, when a shared-venue popup opens, then it fits inside the map and its last link can be scrolled to', async () => {
    await page.viewport(667, 375)
    const events = ['Morning Open Mat', 'Evening Seminar', 'Weekend Camp'].map(
      name => createEvent({ name, description: '', location: leinster })
    )
    await render(
      <EventMap events={events} hasFilters={false} tileUrl={BLANK_TILE} />,
      {
        wrapper: Wrapper,
      }
    )
    await userEvent.click(
      page.getByRole('button', { name: 'Leinster Grappling HQ, 3 events' })
    )
    const popup = page.getByTestId(EventMapTestIds.POPUP)
    await expect.element(popup).toBeVisible()

    const wrapper = document.querySelector('.leaflet-popup-content-wrapper')
    const content = document.querySelector('.leaflet-popup-content')
    if (!wrapper || !content) {
      throw new Error('no popup')
    }
    await expect
      .poll(() => wrapper.getBoundingClientRect().top)
      .toBeGreaterThanOrEqual(mapRect().top)
    expect(wrapper.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      mapRect().bottom
    )
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight)
    const links = page.getByTestId(EventMapTestIds.POPUP_EVENT_LINK).elements()
    const last = links.at(-1)
    if (!last) {
      throw new Error('no links')
    }
    last.scrollIntoView({ block: 'nearest' })
    const linkRect = last.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    expect(linkRect.bottom).toBeLessThanOrEqual(contentRect.bottom + 1)
  })

  it('AC-EVT-016: given the map was opened tall and then made short, when a shared-venue popup opens, then it still fits inside the map', async () => {
    await page.viewport(375, 900)
    const events = ['Morning Open Mat', 'Evening Seminar', 'Weekend Camp'].map(
      name => createEvent({ name, description: '', location: leinster })
    )
    await render(
      <EventMap events={events} hasFilters={false} tileUrl={BLANK_TILE} />,
      {
        wrapper: Wrapper,
      }
    )
    await expect
      .element(
        page.getByRole('button', { name: 'Leinster Grappling HQ, 3 events' })
      )
      .toBeVisible()

    // A phone turned to landscape: the map drops to its minimum height.
    await page.viewport(667, 375)
    await userEvent.click(
      page.getByRole('button', { name: 'Leinster Grappling HQ, 3 events' })
    )
    await expect.element(page.getByTestId(EventMapTestIds.POPUP)).toBeVisible()

    const frame = elementFor('.leaflet-popup-content-wrapper')
    await expect
      .poll(() => frame.getBoundingClientRect().top)
      .toBeGreaterThanOrEqual(mapRect().top)
    expect(frame.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      mapRect().bottom
    )
  })

  it('AC-EVT-016: given phone width, when a pin near the controls opens, then the popup clears the zoom control and the attribution', async () => {
    await page.viewport(375, 667)
    const west = eventAt('Atlantic Coast Grappling Hall', -9.5145, 53.8008)
    await render(
      <EventMap
        events={[west, cork]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      {
        wrapper: Wrapper,
      }
    )
    await userEvent.click(
      page.getByRole('button', { name: 'Atlantic Coast Grappling Hall' })
    )
    await expect.element(page.getByTestId(EventMapTestIds.POPUP)).toBeVisible()

    const popupRect = (): DOMRect =>
      elementFor('.leaflet-popup-content-wrapper').getBoundingClientRect()
    const overlaps = (a: DOMRect, b: DOMRect): boolean =>
      a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top
    const zoom = elementFor('.leaflet-control-zoom').getBoundingClientRect()
    const attribution = page
      .getByTestId(EventMapTestIds.ATTRIBUTION)
      .element()
      .getBoundingClientRect()

    await expect.poll(() => overlaps(popupRect(), zoom)).toBe(false)
    expect(overlaps(popupRect(), attribution)).toBe(false)
  })

  it('AC-EVT-011: given a long unbroken address, when the popup opens, then the text wraps inside it', async () => {
    const long = createEvent({
      name: 'Long Address Seminar',
      location: { ...leinster, address: 'Unit'.padEnd(120, 'X') },
    })
    await render(
      <EventMap events={[long]} hasFilters={false} tileUrl={BLANK_TILE} />,
      { wrapper: Wrapper }
    )
    await userEvent.click(
      page.getByRole('button', { name: 'Leinster Grappling HQ' })
    )
    const popup = page.getByTestId(EventMapTestIds.POPUP)
    await expect.element(popup).toBeVisible()

    // Overflowing text spills out of its own box, so compare the box with its content.
    const address = page.getByTestId(EventMapTestIds.POPUP_ADDRESS).element()
    expect(address.scrollWidth).toBeLessThanOrEqual(address.clientWidth)
  })

  it('AC-EVT-010: given two events at one venue, when the map shows them, then one pin opens a popup listing both', async () => {
    const venue = {
      address: '1 Leinster St',
      venue: 'Leinster Grappling HQ',
      coordinates: {
        type: 'Point' as const,
        coordinates: [-6.2889, 53.3382] as [number, number],
      },
    }
    const first = createEvent({
      name: 'Leinster Community Open Mat',
      location: venue,
    })
    const second = createEvent({
      name: 'Winter Solstice Open Mat',
      location: venue,
    })
    await render(
      <EventMap
        events={[first, second, galway]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      {
        wrapper: Wrapper,
      }
    )

    const pin = page.getByRole('button', {
      name: 'Leinster Grappling HQ, 2 events',
    })
    await expect.element(pin).toBeVisible()
    expect(
      document.querySelectorAll(`[data-testid="${EventMapTestIds.PIN}"]`)
    ).toHaveLength(2)

    await userEvent.click(pin)

    await expect
      .element(page.getByText('Leinster Community Open Mat'))
      .toBeVisible()
    await expect
      .element(page.getByText('Winter Solstice Open Mat'))
      .toBeVisible()
  })

  it('AC-EVT-009: given events around Ireland, when pins render, then each sits in its real direction', async () => {
    await render(
      <EventMap
        events={[dublin, galway, belfast, cork]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      { wrapper: Wrapper }
    )
    await expect
      .element(page.getByRole('button', { name: 'Cork BJJ' }))
      .toBeVisible()

    expect(pinCentre('Galway BJJ').x).toBeLessThan(pinCentre('Dublin BJJ').x)
    expect(pinCentre('Belfast BJJ').y).toBeLessThan(pinCentre('Dublin BJJ').y)
    expect(pinCentre('Cork BJJ').y).toBeGreaterThan(pinCentre('Dublin BJJ').y)
    // Dublin and Galway are almost due east-west. Swapped axes would stack them
    // vertically while keeping every direction above true.
    const eastWest = pinCentre('Dublin BJJ').x - pinCentre('Galway BJJ').x
    const northSouth = Math.abs(
      pinCentre('Dublin BJJ').y - pinCentre('Galway BJJ').y
    )
    expect(eastWest).toBeGreaterThan(northSouth * 10)
  })

  it('AC-EVT-011: given a pin, when it is clicked, then the popup shows the event', async () => {
    await render(
      <EventMap
        events={[dublin, galway]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      {
        wrapper: Wrapper,
      }
    )

    await userEvent.click(page.getByRole('button', { name: 'Galway BJJ' }))

    await expect
      .element(page.getByTestId(EventMapTestIds.POPUP_VENUE))
      .toHaveTextContent('Galway BJJ')
    await expect
      .element(page.getByTestId(EventMapTestIds.POPUP_ADDRESS))
      .toHaveTextContent('Galway BJJ Street')
    await expect
      .element(page.getByTestId(EventMapTestIds.POPUP_EVENT_LINK))
      .toBeVisible()
    await expect
      .element(page.getByTestId(EventMapTestIds.POPUP_DIRECTIONS_LINK))
      .toBeVisible()
  })

  it('AC-EVT-016: given keyboard use, when a pin is opened with Enter, then links are reachable and Escape returns to the pin', async () => {
    await render(
      <EventMap
        events={[dublin, galway]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      {
        wrapper: Wrapper,
      }
    )
    const pin = page.getByRole('button', { name: 'Dublin BJJ' })
    await expect.element(pin).toBeVisible()

    ;(pin.element() as HTMLElement).focus()
    await userEvent.keyboard('{Enter}')
    const website = page.getByTestId(EventMapTestIds.POPUP_DIRECTIONS_LINK)
    await expect.element(website).toBeVisible()

    await userEvent.tab()
    expect(document.activeElement).toBe(website.element())

    await userEvent.keyboard('{Escape}')
    await expect
      .element(page.getByTestId(EventMapTestIds.POPUP))
      .not.toBeInTheDocument()
    expect(document.activeElement).toBe(pin.element())
  })

  it('AC-EVT-016: given a focused pin, when Space is pressed, then the popup opens and the page does not scroll', async () => {
    await render(
      <EventMap
        events={[dublin, galway]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      {
        wrapper: Wrapper,
      }
    )
    const pin = page.getByRole('button', { name: 'Dublin BJJ' })
    await expect.element(pin).toBeVisible()
    const scrollBefore = window.scrollY

    ;(pin.element() as HTMLElement).focus()
    await userEvent.keyboard(' ')

    await expect
      .element(page.getByTestId(EventMapTestIds.POPUP_VENUE))
      .toHaveTextContent('Dublin BJJ')
    expect(window.scrollY).toBe(scrollBefore)
  })

  it('AC-EVT-016: given keyboard focus, when a pin and then its popup hold it, then each shows an indicator and the pin rises above its neighbours', async () => {
    await render(
      <EventMap
        events={[dublin, galway]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      {
        wrapper: Wrapper,
      }
    )
    const pin = page.getByRole('button', { name: 'Dublin BJJ' })
    await expect.element(pin).toBeVisible()
    await page.elementLocator(document.body).click()
    while (document.activeElement !== pin.element()) {
      await userEvent.tab()
    }
    expect(getComputedStyle(pin.element()).zIndex).toBe('1000')

    await userEvent.keyboard('{Enter}')
    const popup = page.getByTestId(EventMapTestIds.POPUP)
    await expect.element(popup).toBeVisible()

    expect(document.activeElement).toBe(popup.element())
    expect(getComputedStyle(popup.element()).outlineStyle).not.toBe('none')
  })

  it.each([
    ['coarse', false],
    ['fine', true],
  ])(
    'AC-EVT-016: given a %s pointer, when the map opens, then one-finger dragging is %s',
    async (pointer, canDrag) => {
      const real = window.matchMedia.bind(window)
      vi.spyOn(window, 'matchMedia').mockImplementation(query =>
        query === '(pointer: coarse)'
          ? ({ matches: pointer === 'coarse' } as MediaQueryList)
          : real(query)
      )
      await render(
        <EventMap events={[dublin]} hasFilters={false} tileUrl={BLANK_TILE} />,
        {
          wrapper: Wrapper,
        }
      )
      await expect
        .element(page.getByRole('button', { name: 'Dublin BJJ' }))
        .toBeVisible()

      expect(
        document
          .querySelector('.leaflet-container')
          ?.classList.contains('leaflet-grab')
      ).toBe(canDrag)
    }
  )

  it('AC-EVT-016: given focus has moved to the search box, when Escape closes the popup, then focus stays in the search box', async () => {
    await render(
      <>
        <input aria-label="Search" />
        <EventMap events={[dublin]} hasFilters={false} tileUrl={BLANK_TILE} />
      </>,
      { wrapper: Wrapper }
    )
    await userEvent.click(page.getByRole('button', { name: 'Dublin BJJ' }))
    const popup = page.getByTestId(EventMapTestIds.POPUP)
    await expect.element(popup).toBeVisible()
    const search = page.getByRole('textbox', { name: 'Search' })
    ;(search.element() as HTMLElement).focus()

    await userEvent.keyboard('{Escape}')

    await expect.element(popup).not.toBeInTheDocument()
    expect(document.activeElement).toBe(search.element())
  })

  describe.each([
    ['light', ''],
    ['dark', 'dark'],
    ['competition', 'dark competition'],
  ])('AC-EVT-016: in the %s theme', (_theme, className) => {
    // OpenStreetMap's land colour. Tiles stay light in every theme.
    const TILE_LAND = parseColour('#f2efe9')

    // Starts from a real button: clicking the page would land on the map and focus it by mouse.
    /** A tile in OpenStreetMap's land colour, so the map's edge has real tile under it. */
    function landTileUrl(): string {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('no canvas')
      }
      context.fillStyle = '#f2efe9'
      context.fillRect(0, 0, 256, 256)
      return `${canvas.toDataURL('image/png')}#{z}/{x}/{y}`
    }

    /** The on-screen colour `depth` pixels inside the middle of the map's top edge. */
    async function mapEdgePixel(map: Element, depth: number): Promise<Rgba> {
      const screenshot = await page.screenshot({ element: map, save: false })
      const response = await fetch(`data:image/png;base64,${screenshot}`)
      const image = await createImageBitmap(await response.blob())
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('no canvas')
      }
      context.drawImage(image, 0, 0)
      const [r = 0, g = 0, b = 0] = context.getImageData(
        Math.floor(image.width / 2),
        depth,
        1,
        1
      ).data
      return [r, g, b, 1]
    }

    async function tabTo(element: Element): Promise<void> {
      await userEvent.click(page.getByRole('button', { name: 'Start' }))
      for (let i = 0; i < 12 && document.activeElement !== element; i++) {
        await userEvent.tab()
      }
      expect(document.activeElement).toBe(element)
    }

    function renderWithStart(): ReturnType<typeof render> {
      document.documentElement.className = className
      return render(
        <>
          <button type="button">Start</button>
          <EventMap events={[dublin]} hasFilters={false} tileUrl={BLANK_TILE} />
        </>,
        { wrapper: Wrapper }
      )
    }

    function outline(element: Element): {
      offset: number
      width: number
      colour: string
    } {
      const style = getComputedStyle(element)
      expect(style.outlineStyle).toBe('solid')
      return {
        offset: Number.parseFloat(style.outlineOffset),
        width: Number.parseFloat(style.outlineWidth),
        colour: style.outlineColor,
      }
    }

    afterEach(() => {
      document.documentElement.className = ''
    })

    // Measures the screen, not computed style: an outline can compute correctly and still
    // be painted under the tiles. Light tiles and the dark map background need opposite
    // colours, so the ring has two bands and at least one must stand out.
    async function expectVisibleRing(map: Element, under: Rgba): Promise<void> {
      expect(map.matches(':focus-visible')).toBe(true)
      const bands = [await mapEdgePixel(map, 1), await mapEdgePixel(map, 4)]
      const best = Math.max(...bands.map(band => contrast(band, under)))
      expect(best).toBeGreaterThanOrEqual(3)
    }

    function renderedMap(): Element {
      const map = document.querySelector('.leaflet-container')
      if (!map) {
        throw new Error('no map')
      }
      return map
    }

    it('given keyboard focus on the map over painted tiles, then a visible ring shows with 3:1 contrast', async () => {
      document.documentElement.className = className
      await render(
        <>
          <button type="button">Start</button>
          <EventMap
            events={[dublin]}
            hasFilters={false}
            tileUrl={landTileUrl()}
          />
        </>,
        { wrapper: Wrapper }
      )
      await expect
        .element(page.getByRole('button', { name: 'Dublin BJJ' }))
        .toBeVisible()
      const map = renderedMap()
      // Tiles fade in, so wait until the edge really shows the tile.
      await expect
        .poll(async () => contrast(await mapEdgePixel(map, 1), TILE_LAND))
        .toBeLessThan(1.1)

      await tabTo(map)

      await expectVisibleRing(map, TILE_LAND)
    })

    it('given keyboard focus on the map with tiles failed, then a visible ring shows with 3:1 contrast', async () => {
      document.documentElement.className = className
      await render(
        <>
          <button type="button">Start</button>
          <EventMap
            events={[dublin]}
            hasFilters={false}
            tileUrl={BROKEN_TILE}
          />
        </>,
        { wrapper: Wrapper }
      )
      await expect
        .element(page.getByTestId(EventMapTestIds.NOTICE_TILES_FAILED))
        .toBeVisible()
      const map = renderedMap()
      const background = await mapEdgePixel(map, 1)

      await tabTo(map)

      await expectVisibleRing(map, background)
    })

    it('given keyboard focus on a zoom control, then its ring sits on the control with 3:1 contrast', async () => {
      await renderWithStart()
      const zoomIn = page.getByRole('button', { name: 'Zoom in' })
      await expect.element(zoomIn).toBeVisible()

      await tabTo(zoomIn.element())

      const ring = outline(zoomIn.element())
      const background = parseColour(
        getComputedStyle(zoomIn.element()).backgroundColor
      )
      expect(ring.offset).toBeLessThanOrEqual(-ring.width)
      expect(
        contrast(over(parseColour(ring.colour), background), background)
      ).toBeGreaterThanOrEqual(3)
    })

    it('given a pin on light tiles, then its fill has 3:1 contrast', async () => {
      document.documentElement.className = className
      await render(
        <EventMap events={[dublin]} hasFilters={false} tileUrl={BLANK_TILE} />,
        {
          wrapper: Wrapper,
        }
      )
      const pin = page.getByRole('button', { name: 'Dublin BJJ' })
      await expect.element(pin).toBeVisible()

      const fill = getComputedStyle(pin.element(), '::before').backgroundColor

      expect(
        contrast(over(parseColour(fill), TILE_LAND), TILE_LAND)
      ).toBeGreaterThanOrEqual(3)
    })
  })

  it('AC-EVT-012: given no filters, when the map opens, then all of Ireland is in view', async () => {
    await render(
      <EventMap
        events={[dublin, galway, belfast, cork]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      { wrapper: Wrapper }
    )
    await expect
      .element(page.getByRole('button', { name: 'Cork BJJ' }))
      .toBeVisible()

    for (const name of [
      'Dublin BJJ',
      'Galway BJJ',
      'Belfast BJJ',
      'Cork BJJ',
    ]) {
      expect(isInsideMap(pinCentre(name))).toBe(true)
    }
    expect(tileZoom()).toBeLessThan(9)
  })

  it('AC-EVT-012: given results narrow to one location, when the map updates, then it centres on that location below maximum zoom', async () => {
    const screen = await render(
      <EventMap
        events={[dublin, galway]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      { wrapper: Wrapper }
    )
    await expect
      .element(page.getByRole('button', { name: 'Galway BJJ' }))
      .toBeVisible()

    await screen.rerender(
      <EventMap events={[galway]} hasFilters tileUrl={BLANK_TILE} />
    )

    await expect.poll(tileZoom).toBe(15)
    const map = mapRect()
    const pin = pinCentre('Galway BJJ')
    expect(Math.abs(pin.x - (map.left + map.width / 2))).toBeLessThan(20)
    await expect
      .element(page.getByRole('button', { name: 'Dublin BJJ' }))
      .not.toBeInTheDocument()
  })

  it('AC-EVT-012: given several filtered results, when the map updates, then it fits them more closely than Ireland', async () => {
    const screen = await render(
      <EventMap
        events={[dublin, galway]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      { wrapper: Wrapper }
    )
    await expect
      .element(page.getByRole('button', { name: 'Galway BJJ' }))
      .toBeVisible()
    const wide = pinCentre('Dublin BJJ').x - pinCentre('Galway BJJ').x

    await screen.rerender(
      <EventMap events={[dublin, galway]} hasFilters tileUrl={BLANK_TILE} />
    )

    await expect
      .poll(() => pinCentre('Dublin BJJ').x - pinCentre('Galway BJJ').x)
      .toBeGreaterThan(wide)
    expect(isInsideMap(pinCentre('Dublin BJJ'))).toBe(true)
    expect(isInsideMap(pinCentre('Galway BJJ'))).toBe(true)
  })

  it('AC-EVT-012: given the visitor moved the map, when an interior event leaves the results and the outer bounds stay, then the map still refits', async () => {
    const athlone = eventAt('Athlone BJJ', -7.94, 53.3)
    const screen = await render(
      <EventMap
        events={[dublin, athlone, galway]}
        hasFilters
        tileUrl={BLANK_TILE}
      />,
      { wrapper: Wrapper }
    )
    await expect
      .element(page.getByRole('button', { name: 'Athlone BJJ' }))
      .toBeVisible()
    const fitted = tileZoom()

    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }))
    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }))
    await expect.poll(tileZoom).toBeGreaterThan(fitted)

    await screen.rerender(
      <EventMap events={[dublin, galway]} hasFilters tileUrl={BLANK_TILE} />
    )

    await expect.poll(tileZoom).toBe(fitted)
  })

  it('AC-EVT-012: given the visitor moved the map, when the same results render again, then their view is left alone', async () => {
    const screen = await render(
      <EventMap events={[dublin, galway]} hasFilters tileUrl={BLANK_TILE} />,
      { wrapper: Wrapper }
    )
    await expect
      .element(page.getByRole('button', { name: 'Galway BJJ' }))
      .toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }))
    await expect.poll(tileZoom).toBeGreaterThan(0)
    const zoomed = tileZoom()

    await screen.rerender(
      <EventMap
        events={[{ ...dublin }, { ...galway }]}
        hasFilters
        tileUrl={BLANK_TILE}
      />
    )

    expect(tileZoom()).toBe(zoomed)
  })

  it('AC-EVT-014: given tiles failed, when tiles load cleanly again, then the notice clears', async () => {
    const screen = await render(
      <EventMap events={[dublin]} hasFilters={false} tileUrl={BROKEN_TILE} />,
      {
        wrapper: Wrapper,
      }
    )
    const notice = page.getByTestId(EventMapTestIds.NOTICE_TILES_FAILED)
    await expect.element(notice).toBeVisible()

    // Let the failed load finish, as it would before a visitor pans on.
    await new Promise(resolve => setTimeout(resolve, 300))
    await screen.rerender(
      <EventMap events={[dublin]} hasFilters={false} tileUrl={BLANK_TILE} />
    )

    await expect.element(notice).not.toBeInTheDocument()
  })

  it('AC-EVT-014: given only some tiles fail, when the tiles settle, then the notice appears once and does not flicker', async () => {
    const shown: boolean[] = []
    const observer = new MutationObserver(() => {
      const isShown =
        document.querySelector(
          `[data-testid="${EventMapTestIds.NOTICE_TILES_FAILED}"]`
        ) !== null
      if (shown.at(-1) !== isShown) {
        shown.push(isShown)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    await render(
      <EventMap
        events={[dublin]}
        hasFilters={false}
        tileUrl={PARTLY_BROKEN_TILE}
      />,
      { wrapper: Wrapper }
    )
    // Failed tiles never gain the loaded class, so wait on the "a" tiles and let the rest fail.
    await expect
      .poll(() => document.querySelectorAll('img.leaflet-tile-loaded').length)
      .toBeGreaterThan(0)
    await new Promise(resolve => setTimeout(resolve, 300))
    observer.disconnect()

    expect(shown.at(-1)).toBe(true)
    expect(shown.filter(isShown => isShown)).toHaveLength(1)
  })

  it('AC-EVT-016: given the wheel over the map, when it turns, then the page keeps the event so it can scroll past', async () => {
    await render(
      <EventMap events={[dublin]} hasFilters={false} tileUrl={BLANK_TILE} />,
      {
        wrapper: Wrapper,
      }
    )
    await expect
      .element(page.getByRole('button', { name: 'Dublin BJJ' }))
      .toBeVisible()
    const container = document.querySelector('.leaflet-container')
    const notPrevented = container?.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true })
    )

    expect(notPrevented).toBe(true)
  })

  it('AC-EVT-014: given working tiles, when the map shows, then attribution is visible and no failure notice appears', async () => {
    await render(
      <EventMap events={[dublin]} hasFilters={false} tileUrl={BLANK_TILE} />,
      {
        wrapper: Wrapper,
      }
    )

    const link = page.getByRole('link', { name: 'OpenStreetMap' })
    await expect.element(link).toBeVisible()
    expect(link.element()).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/copyright'
    )
    await expect
      .element(page.getByRole('button', { name: 'Dublin BJJ' }))
      .toBeVisible()
    expect(
      document.querySelector(
        `[data-testid="${EventMapTestIds.NOTICE_TILES_FAILED}"]`
      )
    ).toBeNull()
  })

  it('AC-EVT-014: given tiles are blocked, when the map shows, then a notice links to the list with the filters, the pins stay and the view does not change', async () => {
    await render(
      <EventMap
        events={[dublin, galway]}
        hasFilters={false}
        tileUrl={BROKEN_TILE}
      />,
      {
        wrapper: Wrapper,
      }
    )

    const notice = page.getByTestId(EventMapTestIds.NOTICE_TILES_FAILED)
    await expect.element(notice).toBeVisible()
    const link = notice.getByRole('link', { name: /event list/i })
    expect(link.element().getAttribute('href')).toBe('/events?county=Cork')
    await expect
      .element(page.getByRole('button', { name: 'Dublin BJJ' }))
      .toBeVisible()
    await expect
      .element(page.getByRole('button', { name: 'Galway BJJ' }))
      .toBeVisible()
    await expect.element(page.getByTestId(EventMapTestIds.ROOT)).toBeVisible()
  })

  it('AC-EVT-016: given phone width, when the map shows, then there is no sideways scroll and page remains above and below it', async () => {
    await page.viewport(375, 667)
    await render(
      <EventMap
        events={[dublin, galway]}
        hasFilters={false}
        tileUrl={BLANK_TILE}
      />,
      {
        wrapper: Wrapper,
      }
    )
    await expect
      .element(page.getByRole('button', { name: 'Galway BJJ' }))
      .toBeVisible()

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth
    )
    expect(mapRect().height).toBeLessThan(window.innerHeight)
    expect(mapRect().width).toBeLessThanOrEqual(375)
  })
})
