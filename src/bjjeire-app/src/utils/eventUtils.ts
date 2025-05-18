import { BjjEventType } from '@/types/event';
import { BJJ_EVENT_TYPES } from '@/constants/eventTypes';

export const getEventTypeLabel = (eventType: BjjEventType | string): string => {
  const typeValue = typeof eventType === 'string'
    ? BJJ_EVENT_TYPES.find(t => t.label.toLowerCase() === eventType.toLowerCase())?.value
    : eventType;
  return BJJ_EVENT_TYPES.find(t => t.value === typeValue)?.label || 'Event';
};

export const getEventTypeColorClasses = (eventType: BjjEventType | string): string => {
  const typeValue = typeof eventType === 'string'
    ? BJJ_EVENT_TYPES.find(t => t.label.toLowerCase() === eventType.toLowerCase())?.value
    : eventType;

  switch (typeValue) {
    case BjjEventType.OpenMat:
      return 'bg-green-100 text-green-700';
    case BjjEventType.Camp:
      return 'bg-purple-100 text-purple-700';
    case BjjEventType.Tournament:
      return 'bg-red-100 text-red-700';
    case BjjEventType.Seminar:
      return 'bg-yellow-100 text-yellow-700';
    case BjjEventType.Other:
    default:
      return 'bg-gray-100 text-gray-700';
  }
};