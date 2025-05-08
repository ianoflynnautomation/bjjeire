import { Link } from 'react-router-dom';
import { useState } from 'react';
import SupportModal from './SupportModal';

const Navigation = () => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold text-gray-800">
                  BJJ World
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/events" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300">
                  Events
                </Link>
                <Link to="/dojos" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300">
                  Dojos
                </Link>
                <Link to="/organizations" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300">
                  Organizations
                </Link>
                <Link to="/articles" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300">
                  Articles
                </Link>
                <Link to="/contact" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300">
                  Contact
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsSupportModalOpen(true)}
                className="ml-4 px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 min-w-[160px] justify-center"
              >
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M12.5 0C5.6 0 0 5.6 0 12.5S5.6 25 12.5 25 25 19.4 25 12.5 19.4 0 12.5 0zm0 23.5C6.4 23.5 1.5 18.6 1.5 12.5S6.4 1.5 12.5 1.5 23.5 6.4 23.5 12.5 18.6 23.5 12.5 23.5z"/>
                  <path d="M16.8 11.2c.2-.1.3-.2.5-.3.2-.1.3-.3.4-.4.1-.2.2-.3.2-.5 0-.2 0-.4-.1-.6-.1-.2-.2-.3-.3-.5-.1-.1-.3-.3-.5-.3-.2-.1-.4-.1-.6-.1h-2.5v-1.5h1.5c.2 0 .4 0 .6-.1.2-.1.3-.2.5-.3.1-.1.3-.3.3-.5.1-.2.1-.4.1-.6 0-.2 0-.4-.1-.6-.1-.2-.2-.3-.3-.5-.1-.1-.3-.3-.5-.3-.2-.1-.4-.1-.6-.1h-2.5V3.5h-1.5v1.5h-1.5v1.5h1.5v4.5h-1.5v1.5h1.5v4.5h-1.5v1.5h1.5v1.5h1.5v-1.5h2.5c.2 0 .4 0 .6-.1.2-.1.3-.2.5-.3.1-.1.3-.3.3-.5.1-.2.1-.4.1-.6 0-.2 0-.4-.1-.6-.1-.2-.2-.3-.3-.5-.1-.1-.3-.3-.5-.3-.2-.1-.4-.1-.6-.1h-2.5v-4.5h2.5c.2 0 .4 0 .6-.1z"/>
                </svg>
                Support Project
              </button>
            </div>
          </div>
        </div>
      </nav>
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  );
};

export default Navigation; 