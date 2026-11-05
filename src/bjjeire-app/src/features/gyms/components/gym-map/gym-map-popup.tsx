import { useEffect, useRef, type JSX } from 'react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import type { GymDto } from '@/types/gyms'
import { GymMapTestIds } from '@/constants/gymDataTestIds'
import { uiContent } from '@/config/ui-content'
import { ensureExternalUrlScheme } from '@/utils/formatting-utils'
import { getGoogleMapsUrl } from '@/utils/map-utils'
import { readField, readString } from '@/utils/untrusted'

const { popup } = uiContent.gyms.map
const gymCard = uiContent.gyms.card
const { shared } = uiContent

interface GymMapPopupProps {
  gym: GymDto
  onClose: () => void
}

export const GymMapPopup = function GymMapPopup({
  gym,
  onClose,
}: GymMapPopupProps): JSX.Element {
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

  const name = readString(gym.name) || gymCard.fallbackName
  const location: unknown = gym.location
  const address = readString(readField(location, 'address'))
  const websiteUrl = ensureExternalUrlScheme(readString(gym.website))
  const directionsUrl = getGoogleMapsUrl(gym.location)

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={name}
      tabIndex={-1}
      className="gym-map-popup"
      data-testid={GymMapTestIds.POPUP}
    >
      <h3 className="gym-map-popup-name" data-testid={GymMapTestIds.POPUP_NAME}>
        {name}
      </h3>
      <div data-testid={GymMapTestIds.POPUP_COUNTY}>
        {gym.county} {shared.countySuffix}
      </div>
      {address && (
        <div data-testid={GymMapTestIds.POPUP_ADDRESS}>{address}</div>
      )}
      <div className="gym-map-popup-links">
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${gymCard.visitWebsiteButton}: ${name}`}
            data-testid={GymMapTestIds.POPUP_WEBSITE_LINK}
          >
            {gymCard.visitWebsiteButton}
          </a>
        )}
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${popup.directionsAriaPrefix} ${name}`}
            data-testid={GymMapTestIds.POPUP_DIRECTIONS_LINK}
          >
            {popup.directionsLink}
          </a>
        )}
      </div>
      <button
        type="button"
        aria-label={popup.closeLabel}
        className="gym-map-popup-close"
        onClick={onClose}
        data-testid={GymMapTestIds.POPUP_CLOSE}
      >
        <XMarkIcon aria-hidden="true" />
      </button>
    </div>
  )
}
