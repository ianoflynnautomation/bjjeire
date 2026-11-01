import { Suspense, type ReactElement } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import Navigation from '@/components/layout/navigation'
import Footer from '@/components/layout/footer'
import { PageSuspenseFallback } from '@/components/layout/page-suspense-fallback'
import { paths } from '@/config/paths'
import { AboutPage, features } from '@/config/features'
import { FeatureGate, useFeatureFlagClient } from '@/features/feature-flags'
import '@/index.css'

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
      {features.map(({ flag, path, Component }) => (
        <Route
          key={flag}
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
          <Suspense fallback={<PageSuspenseFallback />}>
            <AppRoutes />
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  )
}
