import { Suspense, ViewTransition, type ReactElement } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router'
import Navigation from '@/components/layout/navigation'
import Footer from '@/components/layout/footer'
import { PageSuspenseFallback } from '@/components/layout/page-suspense-fallback'
import { legacyRedirects, paths } from '@/config/paths'
import { AboutPage, features, featureSubRoutes } from '@/config/features'
import { FeatureGate, useFeatureFlagClient } from '@/features/feature-flags'
import '@/index.css'

// An old address keeps its query (a bookmarked ?q= search) and fragment on the way to its new home.
function LegacyRedirect({ to }: { to: string }): ReactElement {
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: to, search, hash }} replace />
}

export function AppRoutes(): ReactElement {
  // Flags are resolved before the first render (main.tsx → loadFeatureFlags).
  // FeatureGate's first paint is the final one, so a disabled route never mounts.
  const client = useFeatureFlagClient()

  const defaultPath =
    features.find(feature => client.isEnabled(feature.flag))?.path ??
    paths.about.path

  return (
    <Routes>
      <Route
        path={paths.home.path}
        element={<Navigate to={defaultPath} replace />}
      />
      {[...features, ...featureSubRoutes].map(({ flag, path, Component }) => (
        <Route
          key={path}
          path={path}
          element={
            <FeatureGate
              flag={flag}
              fallback={<Navigate to={defaultPath} replace />}
            >
              <Component />
            </FeatureGate>
          }
        />
      ))}
      {legacyRedirects.map(({ from, to }) => (
        <Route key={from} path={from} element={<LegacyRedirect to={to} />} />
      ))}
      <Route path={paths.about.path} element={<AboutPage />} />
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  )
}

export default function App(): ReactElement {
  return (
    <Router>
      <div className="min-h-screen text-fg">
        <Navigation />
        <main className="grow">
          <ViewTransition>
            <Suspense fallback={<PageSuspenseFallback />}>
              <AppRoutes />
            </Suspense>
          </ViewTransition>
        </main>
        <Footer />
      </div>
    </Router>
  )
}
