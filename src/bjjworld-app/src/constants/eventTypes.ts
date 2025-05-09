import { BjjEventType } from '../types/event';

export const BJJ_EVENT_TYPES: { value: BjjEventType; label: string }[] = [
  { value: BjjEventType.OpenMat, label: 'Open Mat' },
  { value: BjjEventType.Seminar, label: 'Seminar' },
  { value: BjjEventType.Tournament, label: 'Tournament' },
  { value: BjjEventType.Camp, label: 'Camp' },
  { value: BjjEventType.Other, label: 'Other' },
];

// Helper to map string to BjjEventType
export const getBjjEventTypeFromString = (typeString: string): BjjEventType => {
  const normalized = typeString.toLowerCase();
  const typeMap: { [key: string]: BjjEventType } = {
    'open mat': BjjEventType.OpenMat,
    openmat: BjjEventType.OpenMat,
    seminar: BjjEventType.Seminar,
    tournament: BjjEventType.Tournament,
    camp: BjjEventType.Camp,
    other: BjjEventType.Other,
  };
  return typeMap[normalized] ?? BjjEventType.Other;
};