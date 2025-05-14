// src/utils/priceCalculator.ts
import { BjjEventDto, PricingType } from '../types/event'; // Adjust path

// Define the return type for clarity and reusability
export interface CalculatedPrice {
  total: number;
  unit: string; // e.g., 'event', 'session', 'day'
  currency: string;
}

export const calculateEventPrice = (
  pricing: BjjEventDto['pricing']
): CalculatedPrice => {
  if (pricing.type === PricingType.Free) {
    // For free events, currency might be irrelevant or you might choose to set a default
    return { total: 0, unit: 'event', currency: '' };
  }

  // Example: if pricing DTO directly contains unit and currency
  // const unit = pricing.unit || 'event';
  // const currency = pricing.currency || 'USD'; // Default currency

  // Placeholder for more complex logic:
  // This is a simplified example. You'd have real logic here.
  const total = pricing.amount || 0;
  const currency = pricing.currency || 'USD'; // Default or from pricing
  const unit = 'event'; // Or determine from pricing/schedule

  return { total, unit, currency };
};