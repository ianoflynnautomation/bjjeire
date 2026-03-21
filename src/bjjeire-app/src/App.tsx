import { lazy, Suspense, useEffect, type ReactElement } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import Navigation from '@/components/layout/navigation'
import Footer from '@/components/layout/footer'
import { PageSuspenseFallback } from '@/components/layout/page-suspense-fallback'
import { trackPageView } from '@/utils/telemetry'
import { paths } from '@/config/paths'
import { useAnalytics } from '@/hooks/useAnalytics'
import '@/index.css'

const EventsPage = lazy(() => import('@/pages/EventsPage'))
const GymsPage = lazy(() => import('@/pages/GymsPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))

function PageViewTracker(): null {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return null
}

export default function App(): ReactElement {
  useAnalytics()

  return (
    <Router>
      <PageViewTracker />
      <div className="min-h-screen text-slate-900 dark:text-slate-100">
        <Navigation />
        <main className="flex-grow">
          <Suspense fallback={<PageSuspenseFallback />}>
            <Routes>
              <Route
                path={paths.home.path}
                element={<Navigate to={paths.events.path} replace />}
              />
              <Route path={paths.events.path} element={<EventsPage />} />
              <Route path={paths.gyms.path} element={<GymsPage />} />
              <Route path={paths.about.path} element={<AboutPage />} />
              <Route
                path="*"
                element={<Navigate to={paths.events.path} replace />}
              />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  )
}
