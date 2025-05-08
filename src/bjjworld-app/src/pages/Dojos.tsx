import { useState } from 'react';
import { CITIES } from '../constants/cities';
import DojoForm from '../components/DojoForm';

interface Dojo {
  id: number;
  name: string;
  city: typeof CITIES[number];
  address: string;
  description: string;
  website?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
}

const Dojos = () => {
  const [selectedCity, setSelectedCity] = useState<typeof CITIES[number] | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dojos, setDojos] = useState<Dojo[]>([
    {
      id: 1,
      name: "Cork BJJ Academy",
      city: "Cork",
      address: "Bahnhofstrasse 123, 8001 Cork",
      description: "Premier BJJ training facility in Cork offering classes for all levels.",
      website: "https://example.com",
      phone: "+41 44 123 4567",
      email: "info@zurichbjj.ch",
      imageUrl: "https://via.placeholder.com/400x300"
    },
    {
      id: 2,
      name: "Dublin Grappling Club",
      city: "Dublin",
      address: "O'Connell Street 45, Dublin 1",
      description: "Modern facility with world-class instructors and training partners.",
      website: "https://example.com",
      phone: "+353 1 234 5678",
      email: "contact@dublingrappling.com",
      imageUrl: "https://via.placeholder.com/400x300"
    }
  ]);

  const handleSubmitDojo = (dojoData: Omit<Dojo, 'id'>) => {
    const newDojo = {
      ...dojoData,
      id: dojos.length + 1,
    };
    setDojos([...dojos, newDojo]);
  };

  const filteredDojos = dojos.filter(dojo => 
    selectedCity === 'all' || dojo.city === selectedCity
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">BJJ Dojos</h1>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submit Dojo
          </button>
        </div>

        {/* City Filter */}
        <div className="mb-8">
          <div className="max-w-xs">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as typeof CITIES[number] | 'all')}
              className="w-full py-2 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dojos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDojos.map((dojo) => (
            <div key={dojo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {dojo.imageUrl && (
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={dojo.imageUrl}
                    alt={dojo.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{dojo.name}</h3>
                <p className="text-gray-600 mb-4">{dojo.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{dojo.address}</span>
                  </div>
                  
                  {dojo.phone && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{dojo.phone}</span>
                    </div>
                  )}
                  
                  {dojo.email && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{dojo.email}</span>
                    </div>
                  )}
                </div>

                {dojo.website && (
                  <a
                    href={dojo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DojoForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitDojo}
      />
    </div>
  );
};

export default Dojos; 