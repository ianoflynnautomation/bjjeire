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
import { FeatureFlagProvider, useFeatureFlag } from '@/features/feature-flags'
import '@/index.css'

const EventsPage = lazy(() => import('@/pages/EventsPage'))
const GymsPage = lazy(() => import('@/pages/GymsPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))

function AppRoutes(): ReactElement {
  const eventsEnabled = useFeatureFlag('BjjEvents')
  const gymsEnabled = useFeatureFlag('Gyms')

  const defaultPath = eventsEnabled
    ? paths.events.path
    : gymsEnabled
      ? paths.gyms.path
      : paths.about.path

  return (
    <Routes>
      <Route
        path={paths.home.path}
        element={<Navigate to={defaultPath} replace />}
      />
      <Route
        path={paths.events.path}
        element={
          eventsEnabled ? <EventsPage /> : <Navigate to={defaultPath} replace />
        }
      />
      <Route
        path={paths.gyms.path}
        element={
          gymsEnabled ? <GymsPage /> : <Navigate to={defaultPath} replace />
        }
      />
      <Route path={paths.about.path} element={<AboutPage />} />
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  )
}

export default function App(): ReactElement {
  return (
    <Router>
      <FeatureFlagProvider>
        <div className="min-h-screen text-slate-900 dark:text-slate-100">
          <Navigation />
          <main className="grow">
            <Suspense fallback={<PageSuspenseFallback />}>
              <AppRoutes />
            </Suspense>
          </main>
          <Footer />
        </div>
      </FeatureFlagProvider>
    </Router>
  )
}
