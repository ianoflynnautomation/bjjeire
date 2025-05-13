import { BjjEventType, PricingType, ScheduleType, BjjEventHoursDto, EventStatus } from '../../../types/event';
import { COUNTIES } from '../../../constants/counties';
import { County } from '../../../constants/counties';
import { BJJ_EVENT_TYPES } from '../../../constants/eventTypes';
import { FormDataTypeForState, FormBjjEventHoursDto, FormFixedDateSchedule } from './eventForm.types';

export const generateTempKey = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

export const getDefaultFormData = (): FormDataTypeForState => ({
  name: '',
  description: null,
  type: BJJ_EVENT_TYPES[0]?.value ?? BjjEventType.OpenMat,
  organiser: {
    name: '',
    website: '',
  },
  status: EventStatus.Upcoming,
  statusReason: null,
  socialMedia: {
    instagram: '',
    facebook: '',
    x: '',
    youTube: '',
  },
  county: COUNTIES[0]?.value ?? County.Dublin,
  location: {
    address: '',
    venue: '',
    coordinates: {
      type: 'Point',
      latitude: 0,
      longitude: 0,
      placeName: null,
      placeId: null,
    },
  },
  pricing: {
    type: PricingType.Free,
    amount: 0,
    durationDays: null,
    currency: 'EUR',
  },
  schedule: {
    scheduleType: ScheduleType.FixedDate,
    startDate: '',
    endDate: undefined,
    hours: [],
  } as FormFixedDateSchedule,
  eventUrl: '',
  imageUrl: '',
});

export const mapFormHoursToDtoHours = (
  formHours: FormBjjEventHoursDto[],
  scheduleType: ScheduleType
): BjjEventHoursDto[] => {
  return formHours.map((formHour) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _formKey, ...dtoHour } = formHour;

    if (scheduleType === ScheduleType.FixedDate) {
      return {
        ...dtoHour,
        date: dtoHour.date || null,
        dayOfWeek: null,
      };
    } else {
      // Recurring
      return {
        ...dtoHour,
        dayOfWeek: dtoHour.dayOfWeek ?? null,
        date: null,
      };
    }
  });
};