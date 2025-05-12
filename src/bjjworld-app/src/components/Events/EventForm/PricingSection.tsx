import React from 'react'
import { PricingType, BjjEventPricingModelDto } from '../../../types/event'
import { EventFormTestIds } from './eventForm.testIds'

interface PricingSectionProps {
  pricing: BjjEventPricingModelDto
  isSubmitting: boolean
  onPricingChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  pricing,
  isSubmitting,
  onPricingChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Pricing Type */}
      <div>
        <label
          htmlFor="pricing.type"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Pricing Type <span className="text-red-500">*</span>
        </label>
        <select
          id="pricing.type"
          name="pricing.type"
          value={pricing.type}
          onChange={onPricingChange}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          disabled={isSubmitting}
          required
          data-testid={EventFormTestIds.PRICING_TYPE_SELECT}
          aria-required="true"
        >
          {/* Map over PricingType enum values */}
          {Object.entries(PricingType)
            // Filter out numeric keys if using a standard enum, keep string keys
            .filter(([key]) => isNaN(Number(key)))
            .map(([key, value]) => (
              <option key={value} value={value}>
                {/* Simple formatting for label */}
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </option>
            ))}
          {/* Or define options manually if preferred */}
          {/* <option value={PricingType.Free}>Free</option>
          <option value={PricingType.FlatRate}>Flat Rate</option>
          <option value={PricingType.PerSession}>Per Session</option>
          <option value={PricingType.PerDay}>Per Day</option> */}
        </select>
      </div>

      {/* Pricing Amount - Conditionally rendered */}
      {pricing.type !== PricingType.Free && (
        <div>
          <label
            htmlFor="pricing.amount"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Cost ({pricing.currency || 'EUR'}) <span className="text-red-500">*</span>
          </label>
          <input
            id="pricing.amount"
            type="number"
            name="pricing.amount"
            value={pricing.amount}
            onChange={onPricingChange}
            placeholder="e.g., 20.00"
            className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Hide number spinners
            disabled={isSubmitting}
            min="0"
            step="0.01" // Allow cents
            required // Required if pricing type is not Free
            data-testid={EventFormTestIds.PRICING_AMOUNT_INPUT}
            aria-required="true"
          />
          {/* Consider adding Currency selection if needed */}
          {/* <input type="hidden" name="pricing.currency" value={pricing.currency || 'EUR'} /> */}
        </div>
      )}
    </div>
  )
}
