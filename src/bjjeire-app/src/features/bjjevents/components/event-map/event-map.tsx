import { useEffect, useRef, useState, type JSX } from 'react'
import L, { type LeafletEventHandlerFnMap } from 'leaflet'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import { Link, useSearchParams } from 'react-router'
import 'leaflet/dist/leaflet.css'
import './event-map.css'
import type { BjjEventDto } from '@/types/event'
import { EventMapTestIds } from '@/constants/eventDataTestIds'
import { uiContent } from '@/config/ui-content'
import { withEventView } from '@/features/bjjevents/utils/event-view-url'
import { OSM_TILE_URL } from './event-map-config'
import { EventMapPopup } from './event-map-popup'
import {
  eventLocationName,
  toEventLocations,
  type EventLocation,
} from './event-locations'
import {
  computeMapBounds,
  IRELAND_BOUNDS,
  type MapBounds,
} from './event-map-bounds'

const { map: mapContent } = uiContent.events

const OSM_MAX_ZOOM = 19
const MIN_ZOOM = 5
const IRELAND_CENTER: [number, number] = [
  (IRELAND_BOUNDS.south + IRELAND_BOUNDS.north) / 2,
  (IRELAND_BOUNDS.west + IRELAND_BOUNDS.east) / 2,
]
const INITIAL_ZOOM = 6
/** Street-level context for a single location, short of OpenStreetMap's maximum. */
const FIT_MAX_ZOOM = 15
const FIT_PADDING: [number, number] = [32, 32]

// A CSS-only marker: no image assets to resolve, and no HTML string to inject.
const PIN_ICON = L.divIcon({
  className: 'event-map-pin',
  iconSize: [28, 28],
  iconAnchor: [14, 32],
  popupAnchor: [0, -30],
})

/**
 * Room a popup keeps from the map's edges when it opens: clear of the zoom
 * control at the top left and the attribution at the bottom right, so neither
 * covers it at phone width.
 */
const POPUP_PADDING_TOP_LEFT: [number, number] = [56, 12]
const POPUP_PADDING_BOTTOM_RIGHT: [number, number] = [12, 36]
/** The paddings above, plus the popup's tip and frame. */
const POPUP_FRAME_HEIGHT = 110
const POPUP_FRAME_WIDTH = 80
const POPUP_MAX_WIDTH = 300
const POPUP_MIN_HEIGHT = 120
const POPUP_MIN_WIDTH = 160

/**
 * Sizes the popup to the map as it is now, not as it was when the pins were
 * made: a phone turned to landscape has a much shorter map. Leaflet keeps
 * popup content mounted, so the content's own mount effect only focuses it the
 * first time; this moves focus in on every open.
 */
function prepareOpenedPopup(event: L.PopupEvent, map: L.Map): void {
  const { popup } = event
  const size = map.getSize()
  popup.options.maxHeight = Math.max(
    POPUP_MIN_HEIGHT,
    size.y - POPUP_FRAME_HEIGHT
  )
  popup.options.maxWidth = Math.min(
    POPUP_MAX_WIDTH,
    Math.max(POPUP_MIN_WIDTH, size.x - POPUP_FRAME_WIDTH)
  )
  popup.update()
  popup
    .getElement()
    ?.querySelector<HTMLElement>('[tabindex="-1"]')
    ?.focus({ preventScroll: true })
}

/**
 * Phones and tablets, by primary pointer rather than user agent alone. A laptop
 * with a touchscreen has a fine primary pointer and keeps mouse dragging.
 */
function usesTouchFirst(): boolean {
  return L.Browser.mobile || window.matchMedia('(pointer: coarse)').matches
}

interface MapViewportProps extends MapBounds {
  /** Which events are showing. Results can change while their outer bounds do not. */
  resultsKey: string
}

const MapViewport = function MapViewport({
  south,
  west,
  north,
  east,
  resultsKey,
}: MapViewportProps): null {
  const map = useMap()

  // Primitive dependencies, so only a real change of results moves the map and
  // a re-render never undoes the visitor's own panning.
  useEffect(() => {
    if (map.getSize().x === 0) {
      return
    }
    map.fitBounds(
      [
        [south, west],
        [north, east],
      ],
      { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, animate: false }
    )
  }, [map, south, west, north, east, resultsKey])

  return null
}

const EventPins = function EventPins({
  locations,
}: {
  locations: EventLocation[]
}): JSX.Element {
  const map = useMap()

  const handlers: LeafletEventHandlerFnMap = {
    add: event => {
      const marker = event.target as L.Marker
      const element = marker.getElement()
      element?.setAttribute('data-testid', EventMapTestIds.PIN)
      // Leaflet gives pins role="button" but only handles Enter.
      element?.addEventListener('keydown', keyEvent => {
        if (keyEvent.key === ' ') {
          keyEvent.preventDefault()
          marker.openPopup()
        }
      })
    },
    popupopen: event => {
      prepareOpenedPopup(event, map)
    },
    popupclose: event => {
      const marker = event.target as L.Marker
      // Return focus only if closing would otherwise lose it, not if the visitor has moved on.
      const active = document.activeElement
      if (active === document.body || active?.closest('.leaflet-popup')) {
        marker.getElement()?.focus({ preventScroll: true })
      }
    },
  }

  return (
    <>
      {locations.map(location => (
        <Marker
          // Leaflet keeps a marker's title from creation. Keying on the events too
          // gives a new marker, with the right name, when filters change them.
          key={`${location.key}|${location.events.map(event => event.id).join('+')}`}
          position={[location.latitude, location.longitude]}
          icon={PIN_ICON}
          title={eventLocationName(location)}
          eventHandlers={handlers}
        >
          <Popup
            closeButton={false}
            autoPanPaddingTopLeft={POPUP_PADDING_TOP_LEFT}
            autoPanPaddingBottomRight={POPUP_PADDING_BOTTOM_RIGHT}
          >
            <EventMapPopup
              location={location}
              onClose={() => map.closePopup()}
            />
          </Popup>
        </Marker>
      ))}
    </>
  )
}

interface EventMapProps {
  events: BjjEventDto[]
  hasFilters: boolean
  isTruncated?: boolean
  /** Overridden in tests so they never depend on live OpenStreetMap. */
  tileUrl?: string
}

const NOTICE_CLASS =
  'mb-3 rounded-lg border border-border-strong bg-surface-solid px-3 py-2 text-sm text-fg'

export const EventMap = function EventMap({
  events,
  hasFilters,
  isTruncated = false,
  tileUrl = OSM_TILE_URL,
}: EventMapProps): JSX.Element {
  const [searchParams] = useSearchParams()
  const [tilesFailed, setTilesFailed] = useState(false)
  const tileFailedThisLoad = useRef(false)

  const { locations, unmappedCount } = toEventLocations(events)
  const bounds = computeMapBounds(locations, hasFilters)
  const listSearch = withEventView(searchParams, 'list').toString()
  const { notices, attribution } = mapContent

  return (
    <div className="event-map" data-testid={EventMapTestIds.ROOT}>
      {isTruncated && (
        <p
          role="status"
          className={NOTICE_CLASS}
          data-testid={EventMapTestIds.NOTICE_TRUNCATED}
        >
          {notices.truncated}
        </p>
      )}
      {unmappedCount > 0 && (
        <p
          role="status"
          className={NOTICE_CLASS}
          data-testid={EventMapTestIds.NOTICE_UNMAPPED}
        >
          {unmappedCount}{' '}
          {unmappedCount === 1
            ? notices.unmappedSingular
            : notices.unmappedPlural}
        </p>
      )}
      {tilesFailed && (
        <p
          role="status"
          className={NOTICE_CLASS}
          data-testid={EventMapTestIds.NOTICE_TILES_FAILED}
        >
          {notices.tilesFailed}{' '}
          <Link
            to={{ search: listSearch }}
            className="font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
          >
            {notices.tilesFailedListLink}
          </Link>
        </p>
      )}
      <div
        role="region"
        aria-label={mapContent.ariaLabel}
        className="relative isolate h-[60vh] max-h-160 min-h-72 w-full overflow-hidden rounded-xl border border-hairline"
      >
        <MapContainer
          center={IRELAND_CENTER}
          zoom={INITIAL_ZOOM}
          minZoom={MIN_ZOOM}
          maxZoom={OSM_MAX_ZOOM}
          className="h-full w-full"
          attributionControl={false}
          zoomControl={false}
          // The wheel and a one-finger drag must keep scrolling the page past the map.
          scrollWheelZoom={false}
          dragging={!usesTouchFirst()}
          // Leaflet's transition timer outlives the map and throws if results empty mid-zoom.
          zoomAnimation={false}
        >
          <TileLayer
            url={tileUrl}
            maxZoom={OSM_MAX_ZOOM}
            eventHandlers={{
              tileerror: () => {
                tileFailedThisLoad.current = true
                setTilesFailed(true)
              },
              // Clears only after a whole load with no failure, so a partial outage does not flicker.
              load: () => {
                if (!tileFailedThisLoad.current) {
                  setTilesFailed(false)
                }
                tileFailedThisLoad.current = false
              },
            }}
          />
          <ZoomControl
            position="topleft"
            zoomInTitle={mapContent.zoomInLabel}
            zoomOutTitle={mapContent.zoomOutLabel}
          />
          <MapViewport
            {...bounds}
            resultsKey={locations
              .map(location => location.events.map(event => event.id).join('+'))
              .join('|')}
          />
          <EventPins locations={locations} />
        </MapContainer>
        <p
          className="event-map-attribution absolute right-0 bottom-0 z-1000 m-0 rounded-tl bg-surface-solid px-1.5 py-0.5 text-xs text-fg"
          data-testid={EventMapTestIds.ATTRIBUTION}
        >
          {attribution.prefix}{' '}
          <a
            href={attribution.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {attribution.linkText}
          </a>{' '}
          {attribution.suffix}
        </p>
      </div>
    </div>
  )
}
