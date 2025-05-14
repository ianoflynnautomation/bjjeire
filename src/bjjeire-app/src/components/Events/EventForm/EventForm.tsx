/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ScheduleType,
  BjjEventType,
  EventFormData,
  BjjEventHoursDto,
  PricingType,
  FixedDateSchedule,
  RecurringSchedule,
  EventScheduleUnion,
  EventStatus,
  BjjEventPricingModelDto,
} from '../../../types/event';
import {
  FormDataTypeForState,
  FormEventScheduleUnion,
  FormBjjEventHoursDto,
} from './eventForm.types';
import {
  getDefaultFormData,
  generateTempKey,
  mapFormHoursToDtoHours,
} from './eventForm.utils';
import { EventFormTestIds } from './eventForm.testIds';
import { BasicInfoSection } from './BasicInfoSection';
import { PricingSection } from './PricingSection';
import { ScheduleSection } from './ScheduleSection';
import { FormActions } from './FormActions';
import { County } from '../../../constants/counties';
import { CloseIcon } from '../../common/CloseIcon';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: EventFormData) => Promise<void>;
  isSubmitting: boolean;
  initialData?: Partial<EventFormData>;
}

export const EventForm: React.FC<EventFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
}) => {
  const [formData, setFormData] = useState<FormDataTypeForState>(getDefaultFormData());
  const isEditMode = useMemo(() => !!initialData?.name, [initialData]);

  // Effect to initialize or reset form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const defaultState = getDefaultFormData();
        let effectiveSchedule: FormEventScheduleUnion;

        // Helper to map DTO hours to Form hours
        const mapToFormHours = (
          hours: BjjEventHoursDto[] | undefined,
          type: ScheduleType
        ): FormBjjEventHoursDto[] => {
          return (
            hours?.map((h) => ({
              ...h,
              _formKey: generateTempKey(),
              dayOfWeek: type === ScheduleType.Recurring ? (h.dayOfWeek ?? null) : null,
              date: type === ScheduleType.FixedDate ? (h.date ?? null) : null,
            })) || []
          );
        };

        // Determine initial schedule type and map hours
        if (initialData.schedule?.scheduleType === ScheduleType.FixedDate) {
          const initialScheduleData = initialData.schedule as FixedDateSchedule;
          effectiveSchedule = {
            scheduleType: ScheduleType.FixedDate,
            startDate: initialScheduleData.startDate || '',
            endDate: initialScheduleData.endDate,
            hours: mapToFormHours(initialScheduleData.hours, ScheduleType.FixedDate),
          };
        } else if (initialData.schedule?.scheduleType === ScheduleType.Recurring) {
          const initialScheduleData = initialData.schedule as RecurringSchedule;
          effectiveSchedule = {
            scheduleType: ScheduleType.Recurring,
            startDate: initialScheduleData.startDate,
            endDate: initialScheduleData.endDate,
            hours: mapToFormHours(initialScheduleData.hours, ScheduleType.Recurring),
          };
        } else {
          effectiveSchedule = defaultState.schedule;
        }

        // Merge defaults with initialData
        setFormData({
          ...defaultState,
          name: initialData.name ?? defaultState.name,
          description: initialData.description ?? defaultState.description,
          type: initialData.type ?? defaultState.type,
          organiser: initialData.organiser ?? defaultState.organiser,
          status: initialData.status ?? defaultState.status,
          statusReason: initialData.statusReason ?? defaultState.statusReason,
          socialMedia: initialData.socialMedia ?? defaultState.socialMedia,
          county: initialData.county ?? defaultState.county,
          location: initialData.location ?? defaultState.location,
          pricing: initialData.pricing ?? defaultState.pricing,
          eventUrl: initialData.eventUrl ?? defaultState.eventUrl,
          imageUrl: initialData.imageUrl ?? defaultState.imageUrl,
          schedule: effectiveSchedule,
        });
      } else {
        setFormData(getDefaultFormData());
      }
    }
  }, [initialData, isOpen]);

  // --- Input Handlers ---

  const handleBasicInfoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        if (name === 'organiser.name' || name === 'organiser.website') {
          const field = name.split('.')[1];
          return {
            ...prev,
            organiser: {
              ...prev.organiser,
              [field]: value,
            },
          };
        }
        if (name === 'location.address' || name === 'location.venue') {
          const field = name.split('.')[1];
          return {
            ...prev,
            location: {
              ...prev.location,
              [field]: value,
            },
          };
        }
        if (
          name === 'socialMedia.instagram' ||
          name === 'socialMedia.facebook' ||
          name === 'socialMedia.x' ||
          name === 'socialMedia.youTube'
        ) {
          const field = name.split('.')[1];
          return {
            ...prev,
            socialMedia: {
              ...prev.socialMedia,
              [field]: value,
            },
          };
        }
        return {
          ...prev,
          [name]:
            name === 'type'
              ? (Number(value) as BjjEventType)
              : name === 'city'
              ? (value as County)
              : name === 'status'
              ? (Number(value) as EventStatus)
              : value,
        };
      });
    },
    []
  );

  const handlePricingChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const field = name.split('.')[1] as keyof BjjEventPricingModelDto;

      setFormData((prev) => {
        const newPricing = { ...prev.pricing };

        switch (field) {
          case 'type':
            newPricing.type = Number(value) as PricingType;
            if (newPricing.type === PricingType.Free) {
              newPricing.amount = 0;
            }
            break;
          case 'amount':
            newPricing.amount = value === '' ? 0 : parseFloat(value) || 0;
            break;
          case 'durationDays':
            newPricing.durationDays = value === '' ? null : parseInt(value) || null;
            break;
          case 'currency':
            newPricing.currency = value;
            break;
        }

        return { ...prev, pricing: newPricing };
      });
    },
    []
  );

  const handleScheduleTypeChange = useCallback((newScheduleType: ScheduleType) => {
    setFormData((prev) => {
      const existingStartDate = prev.schedule.startDate;
      const existingEndDate = prev.schedule.endDate;
      let newScheduleObject: FormEventScheduleUnion;

      if (newScheduleType === ScheduleType.FixedDate) {
        newScheduleObject = {
          scheduleType: ScheduleType.FixedDate,
          startDate: existingStartDate || '',
          endDate: existingEndDate,
          hours: [],
        };
      } else {
        newScheduleObject = {
          scheduleType: ScheduleType.Recurring,
          startDate: existingStartDate,
          endDate: existingEndDate,
          hours: [],
        };
      }
      return { ...prev, schedule: newScheduleObject };
    });
  }, []);

  const handleScheduleDetailsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [name]: value || undefined,
        } as FormEventScheduleUnion,
      }));
    },
    []
  );

  const handleHourChange = useCallback(
    (index: number, field: keyof BjjEventHoursDto, value: string | number | null) => {
      setFormData((prev) => {
        const updatedHours = prev.schedule.hours.map((hour, i) => {
          if (i === index) {
            let processedValue = value;
            if ((field === 'date' || field === 'dayOfWeek') && value === '') {
              processedValue = null;
            }
            return { ...hour, [field]: processedValue };
          }
          return hour;
        });

        return {
          ...prev,
          schedule: {
            ...prev.schedule,
            hours: updatedHours,
          } as FormEventScheduleUnion,
        };
      });
    },
    []
  );

  const addHourEntry = useCallback(() => {
    setFormData((prev) => {
      const newHour: FormBjjEventHoursDto = {
        _formKey: generateTempKey(),
        openTime: '09:00',
        closeTime: '11:00',
        dayOfWeek: null,
        date: null,
      };
      const currentSchedule = prev.schedule;

      if (currentSchedule.scheduleType === ScheduleType.FixedDate) {
        newHour.date = currentSchedule.startDate || '';
      } else {
        newHour.dayOfWeek = 0; // Default to Sunday
      }

      return {
        ...prev,
        schedule: {
          ...currentSchedule,
          hours: [...currentSchedule.hours, newHour],
        } as FormEventScheduleUnion,
      };
    });
  }, []);

  const removeHourEntry = useCallback((indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        hours: prev.schedule.hours.filter((_, i) => i !== indexToRemove),
      } as FormEventScheduleUnion,
    }));
  }, []);

  // --- Form Submission ---

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.schedule.hours.length === 0) {
        alert('Please add at least one time slot to the schedule.');
        return;
      }

      const currentFormSchedule = formData.schedule;
      const finalHours = mapFormHoursToDtoHours(
        currentFormSchedule.hours,
        currentFormSchedule.scheduleType
      );

      let finalSchedulePayload: EventScheduleUnion;
      if (currentFormSchedule.scheduleType === ScheduleType.FixedDate) {
        finalSchedulePayload = {
          scheduleType: ScheduleType.FixedDate,
          startDate: currentFormSchedule.startDate,
          endDate: currentFormSchedule.endDate || undefined,
          hours: finalHours,
        };
      } else {
        finalSchedulePayload = {
          scheduleType: ScheduleType.Recurring,
          startDate: currentFormSchedule.startDate || undefined,
          endDate: currentFormSchedule.endDate || undefined,
          hours: finalHours,
        };
      }

      const payload: EventFormData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        organiser: formData.organiser,
        status: formData.status,
        statusReason: formData.statusReason,
        socialMedia: formData.socialMedia,
        county: formData.county,
        location: formData.location,
        pricing: {
          ...formData.pricing,
          amount: Number(formData.pricing.amount) || 0,
        },
        schedule: finalSchedulePayload,
        eventUrl: formData.eventUrl,
        imageUrl: formData.imageUrl,
      };

      try {
        await onSubmit(payload);
      } catch (error) {
        console.error('Submission error in form:', error);
      }
    },
    [formData, onSubmit]
  );

  // --- Render Logic ---

  if (!isOpen) return null;

  const canSubmitForm = formData.schedule.hours.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 p-4 transition-opacity duration-300 ease-in-out animate-fadeIn"
      data-testid={EventFormTestIds.MODAL_OVERLAY}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-form-title"
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white dark:bg-slate-800 shadow-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow"
        data-testid={EventFormTestIds.MODAL_CONTENT}
      >
        {/* Form Header */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <h2
            id="event-form-title"
            className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white"
            data-testid={EventFormTestIds.MODAL_TITLE}
          >
            {isEditMode ? 'Edit Event' : 'Submit New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close form"
            data-testid={EventFormTestIds.CLOSE_BUTTON}
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleFormSubmit}
          className="space-y-6 p-6"
          data-testid={EventFormTestIds.FORM_ELEMENT}
        >
          <BasicInfoSection
            name={formData.name}
            type={formData.type}
            county={formData.county}
            organiser={formData.organiser}
            location={formData.location}
            socialMedia={formData.socialMedia}
            status={formData.status}
            isSubmitting={isSubmitting}
            onInputChange={handleBasicInfoChange}
          />

          <PricingSection
            pricing={formData.pricing}
            isSubmitting={isSubmitting}
            onPricingChange={handlePricingChange}
          />

          <ScheduleSection
            schedule={formData.schedule}
            isSubmitting={isSubmitting}
            onScheduleTypeChange={handleScheduleTypeChange}
            onScheduleDetailsChange={handleScheduleDetailsChange}
            onHourChange={handleHourChange}
            onAddHour={addHourEntry}
            onRemoveHour={removeHourEntry}
          />

          <FormActions
            onClose={onClose}
            isSubmitting={isSubmitting}
            isEditMode={isEditMode}
            canSubmit={canSubmitForm}
          />
        </form>
      </div>
      <style>{`
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes modalShow { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        .animate-modalShow { animation: modalShow 0.3s ease-out 0.1s forwards; }
      `}</style>
    </div>
  );
};