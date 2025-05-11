import React from 'react';
import { MapPinIcon } from '@heroicons/react/20/solid';

interface SelectFilterProps<T> {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  placeholderOptionLabel?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

function SelectFilter<T>({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholderOptionLabel,
  Icon = MapPinIcon,
}: SelectFilterProps<T>) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue as T);
  };

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500" />
        )}
        <select
          id={id}
          value={value as string}
          onChange={handleChange}
          disabled={disabled}
          className="block w-full rounded-md border-emerald-200 pl-10 pr-4 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
        >
          {placeholderOptionLabel && <option value="all">{placeholderOptionLabel}</option>}
          {options.map((option) => (
            <option key={String(option.value)} value={option.value as string}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SelectFilter;