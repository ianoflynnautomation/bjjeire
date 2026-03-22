import { lazy, Suspense, type ReactElement } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import Navigation from '@/components/layout/navigation'
import Footer from '@/components/layout/footer'
import { PageSuspenseFallback } from '@/components/layout/page-suspense-fallback'
import { paths } from '@/config/paths'
import '@/index.css'

const EventsPage = lazy(() => import('@/pages/EventsPage'))
const GymsPage = lazy(() => import('@/pages/GymsPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))

export default function App(): ReactElement {
  return (
    <Router>
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
