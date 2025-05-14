import React from 'react';
import { BjjEventType, EventStatus, OrganizerDto, LocationDto, SocialMediaDto } from '../../../types/event';
import { County, COUNTIES } from '../../../constants/counties';
import { BJJ_EVENT_TYPES } from '../../../constants/eventTypes';
import { EventFormTestIds } from './eventForm.testIds';

interface BasicInfoSectionProps {
  name: string;
  type: BjjEventType;
  county: County;
  organiser: OrganizerDto;
  location: LocationDto;
  socialMedia: SocialMediaDto;
  status: EventStatus;
  isSubmitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  name,
  type,
  county,
  organiser,
  location,
  socialMedia,
  status,
  isSubmitting,
  onInputChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Event Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Event Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={name}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          required
          data-testid={EventFormTestIds.NAME_INPUT}
          aria-required="true"
        />
      </div>

      {/* Event Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Event Type <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          required
          data-testid={EventFormTestIds.TYPE_SELECT}
          aria-required="true"
        >
          {BJJ_EVENT_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          City <span className="text-red-500">*</span>
        </label>
        <select
          id="city"
          name="city"
          value={county}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          required
          data-testid={EventFormTestIds.CITY_SELECT}
          aria-required="true"
        >
          {COUNTIES.map((countyOption) => (
            <option key={countyOption.value} value={countyOption.value}>
              {countyOption.label}
            </option>
          ))}
        </select>
      </div>

      {/* Region */}
      <div>
        <label htmlFor="region" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Region <span className="text-xs text-slate-500">(Optional)</span>
        </label>
        <input
          id="region"
          type="text"
          name="region"
          onChange={onInputChange}
          placeholder="e.g., Berlin"
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          data-testid={EventFormTestIds.REGION_INPUT}
        />
      </div>

      {/* Organiser Name */}
      <div>
        <label htmlFor="organiser.name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Organiser Name <span className="text-xs text-slate-500">(Optional)</span>
        </label>
        <input
          id="organiser.name"
          type="text"
          name="organiser.name"
          value={organiser.name}
          onChange={onInputChange}
          placeholder="e.g., Berlin Grappling Academy"
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          data-testid={EventFormTestIds.ORGANISER_NAME_INPUT}
        />
      </div>

      {/* Organiser Website */}
      <div>
        <label htmlFor="organiser.website" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Organiser Website <span className="text-xs text-slate-500">(Optional)</span>
        </label>
        <input
          id="organiser.website"
          type="text"
          name="organiser.website"
          value={organiser.website}
          onChange={onInputChange}
          placeholder="e.g., https://www.berlingrappling.com"
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          data-testid={EventFormTestIds.ORGANISER_WEBSITE_INPUT}
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="location.address" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Address <span className="text-xs text-slate-500">(Optional)</span>
        </label>
        <input
          id="location.address"
          type="text"
          name="location.address"
          value={location.address}
          onChange={onInputChange}
          placeholder="e.g., Schillerstraße 10, 10625 Berlin"
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          data-testid={EventFormTestIds.ADDRESS_INPUT}
        />
      </div>

      {/* Venue */}
      <div>
        <label htmlFor="location.venue" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Venue <span className="text-xs text-slate-500">(Optional)</span>
        </label>
        <input
          id="location.venue"
          type="text"
          name="location.venue"
          value={location.venue}
          onChange={onInputChange}
          placeholder="e.g., Berlin Grappling Academy"
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          data-testid={EventFormTestIds.VENUE_INPUT}
        />
      </div>

      {/* Social Media - Instagram */}
      <div>
        <label htmlFor="socialMedia.instagram" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Instagram <span className="text-xs text-slate-500">(Optional)</span>
        </label>
        <input
          id="socialMedia.instagram"
          type="text"
          name="socialMedia.instagram"
          value={socialMedia.instagram}
          onChange={onInputChange}
          placeholder="e.g., https://www.instagram.com/berlingrappling"
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          data-testid={EventFormTestIds.INSTAGRAM_INPUT}
        />
      </div>

      {/* Social Media - Facebook */}
      <div>
        <label htmlFor="socialMedia.facebook" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Facebook <span className="text-xs text-slate-500">(Optional)</span>
        </label>
        <input
          id="socialMedia.facebook"
          type="text"
          name="socialMedia.facebook"
          value={socialMedia.facebook}
          onChange={onInputChange}
          placeholder="e.g., https://www.facebook.com/berlingrappling"
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          data-testid={EventFormTestIds.FACEBOOK_INPUT}
        />
      </div>

      {/* Social Media - X */}
      <div>
        <label htmlFor="socialMedia.x" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          X <span className="text-xs text-slate-500">(Optional)</span>
        </label>
        <input
          id="socialMedia.x"
          type="text"
          name="socialMedia.x"
          value={socialMedia.x}
          onChange={onInputChange}
          placeholder="e.g., https://x.com/berlingrappling"
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          data-testid={EventFormTestIds.X_INPUT}
        />
      </div>

      {/* Social Media - YouTube */}
      <div>
        <label htmlFor="socialMedia.youTube" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          YouTube <span className="text-xs text-slate-500">(Optional)</span>
        </label>
        <input
          id="socialMedia.youTube"
          type="text"
          name="socialMedia.youTube"
          value={socialMedia.youTube}
          onChange={onInputChange}
          placeholder="e.g., https://www.youtube.com/@berlingrappling"
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          data-testid={EventFormTestIds.YOUTUBE_INPUT}
        />
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={onInputChange}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          required
          data-testid={EventFormTestIds.STATUS_SELECT}
          aria-required="true"
        >
          {Object.entries(EventStatus)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => (
              <option key={value} value={value}>
                {key}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};