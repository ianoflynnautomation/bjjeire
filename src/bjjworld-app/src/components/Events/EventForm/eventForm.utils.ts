import { BjjEventType, PricingType, ScheduleType } from '../../../types/event'; 
  import { City } from '../../../constants/cities'; 
  import { CITIES } from '../../../constants/cities'; 
  import { BJJ_EVENT_TYPES } from '../../../constants/eventTypes'; 
  import { FormDataTypeForState, FormFixedDateSchedule, FormBjjEventHoursDto} from './eventForm.types';
  import { BjjEventHoursDto } from '../../../types/event'

  export const generateTempKey = (): string =>
    Date.now().toString(36) + Math.random().toString(36).substring(2);
  
  export const getDefaultFormData = (): FormDataTypeForState => ({
    name: '',
    type: BJJ_EVENT_TYPES[0]?.value ?? BjjEventType.OpenMat, 
    city: CITIES[0]?.value ?? City.Dublin,
    address: '',
    pricing: {
      type: PricingType.Free,
      amount: 0,
      durationDays: undefined,
      currency: 'EUR', 
    },
 
    schedule: {
      scheduleType: ScheduleType.FixedDate,
      startDate: '',
      endDate: undefined,
      hours: [],
    } as FormFixedDateSchedule,
    contact: undefined, 
    coordinates: undefined,
    eventUrl: undefined,
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
  