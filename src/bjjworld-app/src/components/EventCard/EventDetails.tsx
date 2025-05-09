import React from 'react';
import { BjjEventDto } from '../../types/event';
import { getGoogleMapsUrl } from '../../utils/mapUtils';
import { EventSocialMedia } from './EventSocialMedia'; 
import {MapPinIcon, CurrencyDollarIcon, GlobeAltIcon, UserIcon, PhoneIcon, EnvelopeIcon,} from '@heroicons/react/20/solid'; // Using solid variant

interface EventDetailItemProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// Helper component for consistent detail item styling
const DetailItem: React.FC<EventDetailItemProps> = ({ icon, children, className }) => (
  <div className={`flex items-start gap-x-2 text-slate-600 ${className || ''}`}>
    <span className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true">
      {icon}
    </span>
    <div className="flex-grow">{children}</div>
  </div>
);


interface EventDetailsProps {
  event: BjjEventDto;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ event }) => {
  const { address, cost, contact } = event;

  return (
    // Removed mb-4 from here as EventCard's div wrapper has mb-4.
    // space-y-3 for slightly more spacing between items.
    <div className="space-y-3 text-sm">
      {address && (
        <DetailItem icon={<MapPinIcon />}>
          <a
            href={getGoogleMapsUrl(event)} // Ensure getGoogleMapsUrl correctly uses event.address and/or event.coordinates
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

      {/* Contact Person, Email, Phone - New Additions */}
      {contact?.contactPerson && (
        <DetailItem icon={<UserIcon />}>
          {contact.contactPerson}
        </DetailItem>
      )}

      {contact?.email && (
        <DetailItem icon={<EnvelopeIcon />}>
          <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 hover:underline transition-colors">
            {contact.email}
          </a>
        </DetailItem>
      )}

      {contact?.phone && (
        <DetailItem icon={<PhoneIcon />}>
          <a href={`tel:${contact.phone}`} className="hover:text-indigo-600 hover:underline transition-colors">
            {contact.phone}
          </a>
        </DetailItem>
      )}

      {/* Contact Website - Now using DetailItem */}
      {contact?.website && (
        <DetailItem icon={<GlobeAltIcon />}>
          <a
            href={contact.website} // Assuming contact.website is a full URL
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 hover:underline transition-colors break-all"
          >
            {contact.website.replace(/^https?:\/\//, '')} {/* Display cleaner URL */}
          </a>
        </DetailItem>
      )}

      {/* Social Media - Delegated to EventSocialMedia */}
      {/* EventSocialMedia should also handle its own title/header if needed */}
      {contact?.socialMedia && Object.values(contact.socialMedia).some(link => !!link) && (
        <div className="pt-2"> {/* Add some spacing if social media is present */}
          {/* Consider if EventSocialMedia needs a title or if DetailItem can wrap its content */}
          {/* For now, assuming EventSocialMedia renders its own section including icons */}
          <EventSocialMedia socialMedia={contact.socialMedia} />
        </div>
      )}
    </div>
  );
};