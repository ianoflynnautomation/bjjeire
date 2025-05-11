import clsx from 'clsx';

export interface ButtonOption<T> {
  value: T;
  label: string;
}

interface ButtonGroupFilterProps<T> {
  label: string;
  options: ButtonOption<T>[];
  selectedValue: T | undefined;
  onValueChange: (value: T | 'all') => void;
  disabled?: boolean;
  allOptionLabel?: string;
}

const ButtonGroupFilter = <T extends string | number>({
  label,
  options,
  selectedValue,
  onValueChange,
  disabled = false,
  allOptionLabel = 'All Types',
}: ButtonGroupFilterProps<T>) => {
  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2">
        {/* "All" Button */}
        <button
          type="button"
          onClick={() => onValueChange('all')}
          disabled={disabled}
          className={clsx(
            'rounded-md px-3 py-1.5 text-sm font-medium border transition-colors',
            selectedValue === undefined
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-600'
              : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300',
            disabled ? 'opacity-50 cursor-not-allowed hover:bg-white hover:border-emerald-200' : ''
          )}
        >
          {allOptionLabel}
        </button>

        {/* Buttons for each option */}
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onValueChange(option.value)}
            disabled={disabled}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium border transition-colors',
              selectedValue === option.value
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-600'
                : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300',
              disabled ? 'opacity-50 cursor-not-allowed hover:bg-white hover:border-emerald-200' : ''
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ButtonGroupFilter;