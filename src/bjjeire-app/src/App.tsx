import { lazy, Suspense, useContext, type ReactElement } from 'react'
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
import { features } from '@/config/features'
import { FeatureFlagProvider } from '@/features/feature-flags'
import { FeatureFlagContext } from '@/features/feature-flags/context/feature-flag-context'
import '@/index.css'

const AboutPage = lazy(() => import('@/pages/AboutPage'))

function AppRoutes(): ReactElement {
  const flags = useContext(FeatureFlagContext)

  const defaultPath =
    features.find(f => flags[f.flag])?.path ?? paths.about.path

  return (
    <Routes>
      <Route
        path={paths.home.path}
        element={<Navigate to={defaultPath} replace />}
      />
      {features.map(({ flag, path, Component }) => (
        <Route
          key={flag}
          path={path}
          element={
            flags[flag] ? <Component /> : <Navigate to={defaultPath} replace />
          }
        />
      ))}
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
