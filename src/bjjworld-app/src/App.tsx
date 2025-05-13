import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import EventsPage from './pages/EventsPage';
import AboutPage from './pages/AboutPage'
import { initGA, trackPageView } from './utils/telemetry';
import './index.css';
import { GymsPage } from './pages/GymsPage';

// Initialize analytics
initGA('G-XXXXXXXXXX'); // Replace with your Google Analytics measurement ID

// Component to track page views
const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return null;
};

function App() {
  return (
    <Router>
      <PageViewTracker />
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<EventsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/gyms" element={<GymsPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Add more routes as needed */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;