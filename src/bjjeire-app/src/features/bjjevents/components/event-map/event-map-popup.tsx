import { useEffect, useRef, type JSX } from 'react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import type { BjjEventDto } from '@/types/event'
import { EventMapTestIds } from '@/constants/eventDataTestIds'
import { uiContent } from '@/config/ui-content'
import { ensureExternalUrlScheme } from '@/utils/formatting-utils'
import { getEventTypeLabel } from '@/utils/event-utils'
import {
  formatScheduleDates,
  formatSessionLine,
} from '@/utils/event-schedule-text'
import { getGoogleMapsUrl } from '@/utils/map-utils'
import { asArray, readField, readString } from '@/utils/untrusted'
import {
  eventLocationName,
  eventVenue,
  type EventLocation,
} from './event-locations'

const { popup, pin } = uiContent.events.map
const { card: eventCard, schedule: scheduleContent } = uiContent.events

/** As on the event card: the dates, or for an undated weekly event its first sessions. */
const MAX_VISIBLE_SESSIONS = 3

interface EventEntryProps {
  event: BjjEventDto
  locationVenue: string
  locationAddress: string
}

const EventEntry = function EventEntry({
  event,
  locationVenue,
  locationAddress,
}: EventEntryProps): JSX.Element {
  const name = readString(event.name) || eventCard.fallbackName
  const types = asArray(event.types).map(getEventTypeLabel).join(' · ')
  const dateText = formatScheduleDates(event.schedule)
  const sessions = asArray(event.schedule?.sessions)
  const visibleSessions = sessions.slice(0, MAX_VISIBLE_SESSIONS)
  const extraSessions = sessions.length - visibleSessions.length
  const ownVenue = eventVenue(event)
  const ownAddress = readString(readField(event.location, 'address')).trim()
  const eventUrl = ensureExternalUrlScheme(readString(event.eventUrl))

  return (
    <li
      className="event-map-popup-event"
      data-testid={EventMapTestIds.POPUP_EVENT}
    >
      <h4
        className="event-map-popup-event-name"
        data-testid={EventMapTestIds.POPUP_EVENT_NAME}
      >
        {name}
      </h4>
      {types && (
        <div
          className="event-map-popup-meta"
          data-testid={EventMapTestIds.POPUP_EVENT_TYPES}
        >
          {types}
        </div>
      )}
      <div data-testid={EventMapTestIds.POPUP_EVENT_DATES}>
        {dateText ? (
          <div>{dateText}</div>
        ) : (
          <>
            {visibleSessions.map((session, index) => (
              <div key={`${session.date ?? session.day}-${index}`}>
                {formatSessionLine(session)}
              </div>
            ))}
            {extraSessions > 0 && (
              <div className="event-map-popup-meta">
                +{extraSessions} {scheduleContent.moreHoursSuffix}
              </div>
            )}
          </>
        )}
      </div>
      {ownVenue && ownVenue !== locationVenue && (
        <div
          className="event-map-popup-meta"
          data-testid={EventMapTestIds.POPUP_EVENT_VENUE}
        >
          {ownVenue}
        </div>
      )}
      {ownAddress && ownAddress !== locationAddress && (
        <div
          className="event-map-popup-meta"
          data-testid={EventMapTestIds.POPUP_EVENT_ADDRESS}
        >
          {ownAddress}
        </div>
      )}
      {eventUrl && (
        <div className="event-map-popup-links">
          <a
            href={eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${eventCard.moreInfoAriaPrefix} ${name}`}
            data-testid={EventMapTestIds.POPUP_EVENT_LINK}
          >
            {popup.eventLink}
          </a>
        </div>
      )}
    </li>
  )
}

interface EventMapPopupProps {
  location: EventLocation
  onClose: () => void
}

export const EventMapPopup = function EventMapPopup({
  location,
  onClose,
}: EventMapPopupProps): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)

  // Leaflet puts popups after every pin in the DOM. Without this a keyboard
  // user would have to tab through the remaining pins to reach the links.
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true })
  }, [])

  // On the document: Tab can carry focus out of the popup while it stays open.
  useEffect((): (() => void) => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return (): void => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // Never empty: a location exists because an event created it.
  const earliest = location.events[0]
  const heading =
    location.venue ||
    readString(earliest.name) ||
    location.address ||
    pin.fallbackVenue
  const directionsUrl = getGoogleMapsUrl(earliest.location)

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={eventLocationName(location)}
      tabIndex={-1}
      className="event-map-popup"
      data-testid={EventMapTestIds.POPUP}
    >
      <h3
        className="event-map-popup-name"
        data-testid={EventMapTestIds.POPUP_VENUE}
      >
        {heading}
      </h3>
      {location.address && (
        <div data-testid={EventMapTestIds.POPUP_ADDRESS}>
          {location.address}
        </div>
      )}
      {directionsUrl && (
        <div className="event-map-popup-links">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${popup.directionsAriaPrefix} ${heading}`}
            data-testid={EventMapTestIds.POPUP_DIRECTIONS_LINK}
          >
            {popup.directionsLink}
          </a>
        </div>
      )}
      <ul className="event-map-popup-events" aria-label={popup.eventsListLabel}>
        {location.events.map((event, index) => (
          <EventEntry
            key={event.id ?? `${readString(event.name)}-${index}`}
            event={event}
            locationVenue={location.venue}
            locationAddress={location.address}
          />
        ))}
      </ul>
      <button
        type="button"
        aria-label={popup.closeLabel}
        className="event-map-popup-close"
        onClick={onClose}
        data-testid={EventMapTestIds.POPUP_CLOSE}
      >
        <XMarkIcon aria-hidden="true" />
      </button>
    </div>
  )
}
