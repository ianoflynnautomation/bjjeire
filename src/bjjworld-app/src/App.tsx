import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Events from './pages/Events';
import Dojos from './pages/Dojos';
import { initGA, trackPageView } from './utils/telemetry';
import './index.css';

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
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/dojos" element={<Dojos />} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;