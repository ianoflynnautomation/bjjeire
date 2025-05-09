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
                className="ml-4 px-5 py-2 bg-[#F7931A] text-white rounded-full text-sm font-medium hover:bg-[#E67E00] transition-colors flex items-center gap-2 min-w-[160px] justify-center border border-[#B35C00] shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="white"/>
                  <path d="M17.0921 10.1344C17.0921 6.80063 14.4006 5.40063 11.4006 5.40063H7.20063V18.6006H11.4006C14.4006 18.6006 17.0921 17.2006 17.0921 13.8669C17.0921 12.2672 16.2006 10.9344 17.0921 10.1344ZM11.4006 7.20063C13.2006 7.20063 14.4006 7.80063 14.4006 9.60063C14.4006 11.4006 13.2006 12.0006 11.4006 12.0006H9.60063V7.20063H11.4006ZM11.4006 16.8006H9.60063V12.0006H11.4006C13.2006 12.0006 14.4006 12.6006 14.4006 14.4006C14.4006 16.2006 13.2006 16.8006 11.4006 16.8006Z" fill="#F7931A"/>
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