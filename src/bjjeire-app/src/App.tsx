import React, { Suspense, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import Navigation from '@/components/layout/navigation'
import Footer from '@/components/layout/footer'
import AboutPage from '@/pages/AboutPage'
import LoadingSpinner from '@/components/ui/spinner/loading-spinner'
import { initGA, trackPageView } from '@/utils/telemetry'
import { paths } from '@/config/paths'
import '@/index.css'

const EventsPage = React.lazy(() => import('@/pages/EventsPage'))
const GymsPage = React.lazy(() => import('@/pages/GymsPage'))

const PageViewTracker = (): null => {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return null
}

function App(): React.JSX.Element {
  useEffect(() => {
    if (import.meta.env.PROD) {
      initGA((import.meta.env.VITE_APP_GA_MEASUREMENT_ID as string | undefined) ?? 'G-XXXXXXXXXX')
    }
  }, [])

  return (
    <Router>
      <PageViewTracker />
      <div className="dark min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/30 text-slate-100">
        <Navigation />
        <main className="flex-grow">
          <Suspense
            fallback={
              <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 p-8">
                <LoadingSpinner size="lg" color="text-emerald-300" text="Loading page..." />
              </div>
            }
          >
            <Routes>
              <Route
                path={paths.home.path}
                element={<Navigate to={paths.events.path} replace />}
              />
              <Route path={paths.events.path} element={<EventsPage />} />
              <Route path={paths.gyms.path} element={<GymsPage />} />
              <Route path={paths.about.path} element={<AboutPage />} />
              <Route path="*" element={<Navigate to={paths.events.path} replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
