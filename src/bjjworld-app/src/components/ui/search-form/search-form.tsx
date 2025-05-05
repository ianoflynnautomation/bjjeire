import { useState, memo } from 'react';

interface SearchFormProps {
  cities: readonly string[];
  onSearch: (city: string) => void;
  isLoading: boolean;
}

function SearchForm({ cities, onSearch, isLoading }: SearchFormProps) {
  const [selectedCity, setSelectedCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCity) {
      onSearch(selectedCity);
      setSelectedCity(''); // Reset after search
    }
  };

  return (
    <form className="flex justify-center mb-8" onSubmit={handleSubmit}>
      <div className="flex md:flex-row flex-col gap-4 w-full max-w-xl bg-white p-2 rounded-full shadow-sm focus-within:shadow-md transition-shadow duration-300">
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="flex-1 py-3 px-5 border-none rounded-3xl bg-transparent text-gray-800 text-base cursor-pointer outline-none [appearance:none] bg-no-repeat bg-[right_1rem_center] bg-[length:1em] pr-10 w-full mb-2 md:mb-0 focus:bg-gray-50"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
          }}
          disabled={isLoading}
          aria-label="Select a city"
        >
          <option value="">Select a city</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="py-3 px-6 bg-blue-600 text-white border-none rounded-3xl text-base font-medium cursor-pointer transition duration-300 whitespace-nowrap hover:bg-blue-800 hover:-translate-y-px disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none w-full md:w-auto"
          disabled={isLoading || !selectedCity}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}

export default memo(SearchForm);