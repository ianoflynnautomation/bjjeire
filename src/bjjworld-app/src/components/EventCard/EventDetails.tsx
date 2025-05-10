import React from 'react'
import { BjjEventDto } from '../../types/event'
import { getGoogleMapsUrl } from '../../utils/mapUtils'
import { EventSocialMedia } from './EventSocialMedia'
import { MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/20/solid'

interface EventDetailItemProps {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}

interface EventDetailsProps {
  event: BjjEventDto
}

const DetailItem: React.FC<EventDetailItemProps> = ({ icon, children, className }) => (
  <div className={`flex items-start gap-x-2 text-slate-600 ${className || ''}`}>
    <span className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true">
      {icon}
    </span>
    <div className="flex-grow">{children}</div>
  </div>
)

export const EventDetails: React.FC<EventDetailsProps> = ({ event }) => {
  const { address, cost, contact } = event

  return (
    <div className="space-y-3 text-sm">
      {address && (
        <DetailItem icon={<MapPinIcon />}>
          <a
            href={getGoogleMapsUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 hover:underline transition-colors"
          >
            {address}
          </a>
        </DetailItem>
      )}

      <DetailItem icon={<CurrencyDollarIcon />}>
        {cost !== null && cost !== undefined && cost > 0 ? `$${cost.toFixed(2)}` : 'Free'}
      </DetailItem>

      {contact?.socialMedia && Object.values(contact.socialMedia).some((link) => !!link) && (
        <div className="pt-2">
          {' '}
          <EventSocialMedia socialMedia={contact.socialMedia} />
        </div>
      )}
    </div>
  )
}
