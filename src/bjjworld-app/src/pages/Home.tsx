import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-light-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Welcome to BJJ Éire
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Connecting the Brazilian Jiu-Jitsu community through events, gyms, and local brands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200 hover:bg-emerald-50 transition-colors">
            <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Events</h2>
            <p className="text-slate-600 mb-6">
              Discover upcoming BJJ open mats, seminars, and training camps.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-emerald-700 hover:to-emerald-800 focus:ring-2 focus:ring-emerald-500 transition-colors"
            >
              Explore Events
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-emerald-200 hover:bg-emerald-50 transition-colors">
            <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Gyms</h2>
            <p className="text-slate-600 mb-6">
              Find BJJ academies and training facilities near you.
            </p>
            <Link
              to="/gyms"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-emerald-700 hover:to-emerald-800 focus:ring-2 focus:ring-emerald-500 transition-colors"
            >
              Find Gyms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;