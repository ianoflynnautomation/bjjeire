// src/components/EventForm.tsx
import React, { useState, useEffect } from 'react';
import { CITIES } from '../constants/cities'; // Using ['Cork', 'Dublin']
import { EventFormData, EventType } from '../types/event'; // Your defined types

// Options for the Event Type dropdown in the form
const FORM_EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
    { value: 'open-mat', label: 'Open Mat' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'tournament', label: 'Tournament' },
    { value: 'camp', label: 'Camp' },
    // Note: 'other' is not in your EventType string union, but BjjEventType.Other exists.
    // If you need 'other' in the form, add it to EventType and here.
];

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: EventFormData) => Promise<void>; // onSubmit can be async
  initialData?: Partial<EventFormData>;
}

const EventForm: React.FC<EventFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const getDefaultFormData = (): EventFormData => ({
    title: '',
    type: 'open-mat', // Default
    city: CITIES[0],   // Default to the first city
    date: new Date().toISOString().split('T')[0], // Default to today
    description: '',
    contactEmail: '',
  });

  const [formData, setFormData] = useState<EventFormData>(getDefaultFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (isOpen) {
      setFormData(initialData ? { ...getDefaultFormData(), ...initialData } : getDefaultFormData());
    }
  }, [isOpen, initialData]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Specific handler for city if its type is more constrained than string
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     setFormData(prev => ({ ...prev, city: e.target.value as 'Cork' | 'Dublin'}));
  }
   const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, type: e.target.value as EventType }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation (can be enhanced with a library like Zod or Yup)
    if (!formData.title || !formData.contactEmail || !formData.date || !formData.type || !formData.city) {
        alert("Please fill in all required fields: Title, Type, City, Date, and Contact Email.");
        return;
    }
    setIsSubmitting(true);
    try {
        await onSubmit(formData);
        // Parent (Events.tsx) will handle closing and showing success message.
        // Form could be reset here if desired, but often parent handles state post-submit.
        // setFormData(getDefaultFormData());
    } catch (error) {
        // Error is typically handled and alerted by the onSubmit callback in Events.tsx
        console.error("Form submission error caught in EventForm:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 m-4 transform transition-all duration-300 ease-in-out animate-scaleUp">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Submit New Event</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text" id="title" name="title" required
              value={formData.title} onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow hover:shadow-md"
              placeholder="e.g., Sunday Open Mat"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Event Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type" name="type" required value={formData.type} onChange={handleTypeChange}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow hover:shadow-md appearance-none bg-white bg-no-repeat bg-right pr-8"
                style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="gray" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M4.516 7.548c.436-.446 1.043-.48 1.576 0L10 11.464l3.908-3.916c.533-.48 1.14-.446 1.576 0 .436.445.408 1.197 0 1.615L10.817 13.86a1.213 1.213 0 01-1.634 0L4.516 9.163c-.409-.418-.436-1.17 0-1.615z"></path></svg>')`, backgroundPosition: 'right 0.7rem center' }}
              >
                {FORM_EVENT_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <select
                id="city" name="city" required value={formData.city} onChange={handleCityChange}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow hover:shadow-md appearance-none bg-white bg-no-repeat bg-right pr-8"
                style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="gray" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M4.516 7.548c.436-.446 1.043-.48 1.576 0L10 11.464l3.908-3.916c.533-.48 1.14-.446 1.576 0 .436.445.408 1.197 0 1.615L10.817 13.86a1.213 1.213 0 01-1.634 0L4.516 9.163c-.409-.418-.436-1.17 0-1.615z"></path></svg>')`, backgroundPosition: 'right 0.7rem center' }}
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Event Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date" id="date" name="date" required value={formData.date} onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow hover:shadow-md"
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              id="description" name="description" value={formData.description} onChange={handleChange}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow hover:shadow-md"
              placeholder="Details about the event, schedule, Gi/No-Gi, price, etc."
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email" id="contactEmail" name="contactEmail" required value={formData.contactEmail} onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow hover:shadow-md"
              placeholder="organizer@example.com"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button" onClick={onClose} disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:opacity-60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-60 disabled:bg-blue-400 transition-all transform hover:scale-105 flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Event'
              )}
            </button>
          </div>
        </form>
      </div>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes scaleUp { from { opacity: 0.8; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleUp { animation: scaleUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default EventForm;