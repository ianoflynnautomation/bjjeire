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
import './gym-map.css'
import type { GymDto } from '@/types/gyms'
import { GymMapTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'
import { withGymView } from '@/features/gyms/utils/gym-view-url'
import { readString } from '@/utils/untrusted'
import { OSM_TILE_URL } from './gym-map-config'
import { GymMapPopup } from './gym-map-popup'
import { toGymPins, type GymPin } from './gym-pins'
import { computeMapBounds, IRELAND_BOUNDS, type MapBounds } from './map-bounds'

const { map: mapContent, card: gymCard } = uiContent.gyms

const OSM_MAX_ZOOM = 19
const MIN_ZOOM = 5
const IRELAND_CENTER: [number, number] = [
  (IRELAND_BOUNDS.south + IRELAND_BOUNDS.north) / 2,
  (IRELAND_BOUNDS.west + IRELAND_BOUNDS.east) / 2,
]
const INITIAL_ZOOM = 6
/** Street-level context for a single gym, short of OpenStreetMap's maximum. */
const FIT_MAX_ZOOM = 15
const FIT_PADDING: [number, number] = [32, 32]

// A CSS-only marker: no image assets to resolve, and no HTML string to inject.
const PIN_ICON = L.divIcon({
  className: 'gym-map-pin',
  iconSize: [28, 28],
  iconAnchor: [14, 32],
  popupAnchor: [0, -30],
})

/**
 * Phones and tablets, by primary pointer rather than user agent alone. A laptop
 * with a touchscreen has a fine primary pointer and keeps mouse dragging.
 */
function usesTouchFirst(): boolean {
  return L.Browser.mobile || window.matchMedia('(pointer: coarse)').matches
}

interface MapViewportProps extends MapBounds {
  /** Which gyms are showing. Results can change while their outer bounds do not. */
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

const GymPins = function GymPins({ pins }: { pins: GymPin[] }): JSX.Element {
  const map = useMap()

  const handlers: LeafletEventHandlerFnMap = {
    add: event => {
      const marker = event.target as L.Marker
      const element = marker.getElement()
      element?.setAttribute('data-testid', GymMapTestIds.PIN)
      // Leaflet gives pins role="button" but only handles Enter.
      element?.addEventListener('keydown', keyEvent => {
        if (keyEvent.key === ' ') {
          keyEvent.preventDefault()
          marker.openPopup()
        }
      })
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
      {pins.map(pin => (
        <Marker
          key={pin.key}
          position={[pin.latitude, pin.longitude]}
          icon={PIN_ICON}
          title={readString(pin.gym.name) || gymCard.fallbackName}
          eventHandlers={handlers}
        >
          <Popup closeButton={false}>
            <GymMapPopup gym={pin.gym} onClose={() => map.closePopup()} />
          </Popup>
        </Marker>
      ))}
    </>
  )
}

interface GymMapProps {
  gyms: GymDto[]
  hasFilters: boolean
  isTruncated?: boolean
  /** Overridden in tests so they never depend on live OpenStreetMap. */
  tileUrl?: string
}

const NOTICE_CLASS =
  'mb-3 rounded-lg border border-border-strong bg-surface-solid px-3 py-2 text-sm text-fg'

export const GymMap = function GymMap({
  gyms,
  hasFilters,
  isTruncated = false,
  tileUrl = OSM_TILE_URL,
}: GymMapProps): JSX.Element {
  const [searchParams] = useSearchParams()
  const [tilesFailed, setTilesFailed] = useState(false)
  const tileFailedThisLoad = useRef(false)

  const { pins, unmappedCount } = toGymPins(gyms)
  const bounds = computeMapBounds(pins, hasFilters)
  const listSearch = withGymView(searchParams, 'list').toString()
  const { notices, attribution } = mapContent

  return (
    <div className="gym-map" data-testid={GymMapTestIds.ROOT}>
      {isTruncated && (
        <p
          role="status"
          className={NOTICE_CLASS}
          data-testid={GymMapTestIds.NOTICE_TRUNCATED}
        >
          {notices.truncated}
        </p>
      )}
      {unmappedCount > 0 && (
        <p
          role="status"
          className={NOTICE_CLASS}
          data-testid={GymMapTestIds.NOTICE_UNMAPPED}
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
          data-testid={GymMapTestIds.NOTICE_TILES_FAILED}
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
            resultsKey={pins.map(pin => pin.key).join('|')}
          />
          <GymPins pins={pins} />
        </MapContainer>
        <p
          className="gym-map-attribution absolute right-0 bottom-0 z-1000 m-0 rounded-tl bg-surface-solid px-1.5 py-0.5 text-xs text-fg"
          data-testid={GymMapTestIds.ATTRIBUTION}
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
