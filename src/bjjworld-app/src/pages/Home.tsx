const Home = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to BJJ Éire
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connecting the Brazilian Jiu-Jitsu community through events, gyms, and local brands.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Events</h2>
            <p className="text-gray-600">Discover upcoming BJJ tournaments, seminars, and training camps.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Dojos</h2>
            <p className="text-gray-600">Find BJJ academies and training facilities near you.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Organizations</h2>
            <p className="text-gray-600">Connect with BJJ federations and organizations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 