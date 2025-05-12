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
} from '../../../types/event'; // Adjust path
import {
  FormDataTypeForState,
  FormEventScheduleUnion,
  FormBjjEventHoursDto,
} from './eventForm.types'; // Adjust path
import {
  getDefaultFormData,
  generateTempKey,
  mapFormHoursToDtoHours,
} from './eventForm.utils';
import { EventFormTestIds } from './eventForm.testIds'; // Adjust path
import { BasicInfoSection } from './BasicInfoSection'; // Adjust path
import { PricingSection } from './PricingSection'; // Adjust path
import { ScheduleSection } from './ScheduleSection'; // Adjust path
import { FormActions } from './FormActions'; // Adjust path
import { City } from '../../../constants/cities'; 
import { CloseIcon } from '../../shared/icons/CloseIcon';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: EventFormData) => Promise<void>; // Expects promise for async handling
  isSubmitting: boolean;
  initialData?: Partial<EventFormData>; // For editing existing events
}

export const EventForm: React.FC<EventFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
}) => {
  const [formData, setFormData] = useState<FormDataTypeForState>(getDefaultFormData());
  const isEditMode = useMemo(() => !!initialData?.name, [initialData]); // Simple check for edit mode

  // Effect to initialize or reset form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // --- Logic to merge initialData with default state ---
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
              _formKey: generateTempKey(), // Add temporary key
              // Ensure correct fields based on type, defaulting to null if missing
              dayOfWeek: type === ScheduleType.Recurring ? (h.dayOfWeek ?? null) : null,
              date: type === ScheduleType.FixedDate ? (h.date ?? null) : null,
            })) || []
          );
        };

        // Determine initial schedule type and map hours
        if (initialData.schedule?.scheduleType === ScheduleType.FixedDate) {
          const initialScheduleData = initialData.schedule as FixedDateSchedule;
          effectiveSchedule = {
            ...initialScheduleData, // Spread existing fixed date fields
            scheduleType: ScheduleType.FixedDate, // Ensure type literal
            startDate: initialScheduleData.startDate || '', // Default if missing
            hours: mapToFormHours(initialScheduleData.hours, ScheduleType.FixedDate),
          };
        } else if (initialData.schedule?.scheduleType === ScheduleType.Recurring) {
          const initialScheduleData = initialData.schedule as RecurringSchedule;
          effectiveSchedule = {
            ...initialScheduleData, // Spread existing recurring fields
            scheduleType: ScheduleType.Recurring, // Ensure type literal
            hours: mapToFormHours(initialScheduleData.hours, ScheduleType.Recurring),
          };
        } else {
          // If initialData has no schedule or unknown type, use default
          effectiveSchedule = defaultState.schedule;
        }

        // Set the form state by merging defaults, initialData (excluding schedule), and the processed schedule
        setFormData({
          ...defaultState,
          ...(initialData as Partial<Omit<EventFormData, 'schedule'>>), // Overlay non-schedule initialData
          schedule: effectiveSchedule, // Set the processed schedule
        });
        // --- End of merge logic ---
      } else {
        // Reset to default if no initialData (creating new event)
        setFormData(getDefaultFormData());
      }
    }
  }, [initialData, isOpen]);

  // --- Input Handlers ---

  const handleBasicInfoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        // Handle specific type conversions if necessary (e.g., for enums)
        [name]:
          name === 'type'
            ? (Number(value) as BjjEventType) // Assuming type is numeric enum
            : name === 'city'
              ? (value as City) // Assuming city is string enum/type
              : value,
      }));
    },
    []
  );

  const handlePricingChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const field = name.split('.')[1]; // Get field name like 'type' or 'amount'

      setFormData((prev) => {
        const newPricing = { ...prev.pricing };

        if (field === 'type') {
          newPricing.type = Number(value) as PricingType;
          // Reset amount to 0 if switching to Free
          if (newPricing.type === PricingType.Free) {
            newPricing.amount = 0;
          }
        } else if (field === 'amount') {
          // Allow empty string temporarily, parse to number or 0
          newPricing.amount = value === '' ? 0 : parseFloat(value) || 0;
        } else {
          // Handle other potential pricing fields like currency if added
          (newPricing as any)[field] = value;
        }

        return { ...prev, pricing: newPricing };
      });
    },
    []
  );

  const handleScheduleTypeChange = useCallback((newScheduleType: ScheduleType) => {
    setFormData((prev) => {
      // Preserve existing dates if possible when switching types
      const existingStartDate = (prev.schedule as any).startDate;
      const existingEndDate = (prev.schedule as any).endDate;
      let newScheduleObject: FormEventScheduleUnion;

      if (newScheduleType === ScheduleType.FixedDate) {
        newScheduleObject = {
          scheduleType: ScheduleType.FixedDate,
          startDate: typeof existingStartDate === 'string' ? existingStartDate : '',
          endDate: existingEndDate,
          hours: [], // Reset hours when type changes
        };
      } else {
        // Recurring
        newScheduleObject = {
          scheduleType: ScheduleType.Recurring,
          startDate: existingStartDate,
          endDate: existingEndDate,
          hours: [], // Reset hours when type changes
        };
      }
      return { ...prev, schedule: newScheduleObject };
    });
  }, []);

  const handleScheduleDetailsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target; // name will be 'startDate' or 'endDate'
      setFormData((prev) => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [name]: value || undefined, // Store as string or undefined if empty
        } as FormEventScheduleUnion, // Type assertion needed here
      }));
    },
    []
  );

  // --- Hour Entry Handlers ---

  const handleHourChange = useCallback(
    (index: number, field: keyof BjjEventHoursDto, value: string | number | null) => {
      setFormData((prev) => {
        const updatedHours = prev.schedule.hours.map((hour, i) => {
          if (i === index) {
            // Handle specific conversions or null assignment
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
        openTime: '09:00', // Sensible defaults
        closeTime: '11:00',
        dayOfWeek: null, // Default to null
        date: null, // Default to null
      };
      const currentSchedule = prev.schedule;

      // Pre-fill date or day based on schedule type
      if (currentSchedule.scheduleType === ScheduleType.FixedDate) {
        newHour.date = currentSchedule.startDate || ''; // Use start date if available
      } else {
        // Recurring: default to first day of week maybe? Or require selection.
        newHour.dayOfWeek = 0; // Default to Sunday/Monday (depending on DAYS_OF_WEEK)
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
        // Basic validation feedback - consider a more robust validation library (e.g., Zod, react-hook-form)
        alert('Please add at least one time slot to the schedule.');
        return;
      }

      // Prepare final payload for submission
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
          endDate: currentFormSchedule.endDate || undefined, // Ensure undefined if empty
          hours: finalHours,
        };
      } else {
        // Recurring
        finalSchedulePayload = {
          scheduleType: ScheduleType.Recurring,
          startDate: currentFormSchedule.startDate || undefined, // Ensure undefined if empty
          endDate: currentFormSchedule.endDate || undefined, // Ensure undefined if empty
          hours: finalHours,
        };
      }

      // Construct the final EventFormData object
      const payload: EventFormData = {
        name: formData.name,
        type: formData.type,
        city: formData.city,
        address: formData.address || undefined,
        pricing: {
            ...formData.pricing,
            // Ensure amount is a number, default to 0 if somehow invalid
            amount: Number(formData.pricing.amount) || 0,
        },
        schedule: finalSchedulePayload,
        contact: formData.contact, // Pass along contact, coordinates, eventUrl if collected
        coordinates: formData.coordinates,
        eventUrl: formData.eventUrl || undefined,
      };

      try {
        await onSubmit(payload); // Call the passed onSubmit prop
        // onClose(); // Optionally close modal on success (often handled by parent via isSubmitting change)
      } catch (error) {
        console.error('Submission error in form:', error);
        // Error handling might be done in the parent component's onSubmit handler
      }
    },
    [formData, onSubmit]
  );

  // --- Render Logic ---

  if (!isOpen) return null;

  const canSubmitForm = formData.schedule.hours.length > 0; // Basic validation check

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
            city={formData.city}
            address={formData.address}
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

          {/* Optional: Add ContactSection, UrlSection etc. here */}

          <FormActions
            onClose={onClose}
            isSubmitting={isSubmitting}
            isEditMode={isEditMode}
            canSubmit={canSubmitForm}
          />
        </form>
      </div>
      {/* Basic CSS for modal animation */}
      <style>{`
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes modalShow { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        .animate-modalShow { animation: modalShow 0.3s ease-out 0.1s forwards; } /* Delay modal animation slightly */
      `}</style>
    </div>
  );
};
