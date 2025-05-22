import React, { Suspense, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'
import Navigation from './components/layout/navigation';
import Footer from './components/layout/footer'
import AboutPage from './pages/AboutPage'
import { initGA, trackPageView } from './utils/telemetry'
import './index.css'
import { paths } from './config/paths'
const EventsPage = React.lazy(() => import('./pages/EventsPage'));
const GymsPage = React.lazy(() => import('./pages/GymsPage'));

// Initialize analytics
initGA('G-XXXXXXXXXX') // Replace with your Google Analytics measurement ID

// Component to track page views
const PageViewTracker = () => {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return null
}

function App() {
  return (
    <Router>
      <PageViewTracker />
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow">
        <Suspense
            fallback={
              <div className="flex h-full items-center justify-center p-8">
                <p className="text-lg text-slate-700 dark:text-slate-300">
                  Loading page...
                </p>
                {/* You can add a spinner or a more sophisticated loading skeleton here */}
              </div>
            }
          >
          <Routes>
            <Route path={paths.home.path} element={<EventsPage />} />
            <Route path={paths.events.path} element={<EventsPage />} />
            <Route path={paths.gyms.path} element={<GymsPage />} />
            <Route path={paths.about.path} element={<AboutPage />} />

            {/* Add more routes as needed */}
          </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
