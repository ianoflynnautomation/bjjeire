import ReactGA from 'react-ga4'

export function initGA(measurementId: string): void {
  ReactGA.initialize(measurementId)
}

export function trackPageView(path: string): void {
  ReactGA.send({ hitType: 'pageview', page: path })
}

export function trackEvent(
  category: string,
  action: string,
  label?: string
): void {
  ReactGA.event({ category, action, label })
}

export function trackFormSubmission(formName: string, success: boolean): void {
  trackEvent(
    'Form',
    'Submit',
    `${formName} - ${success ? 'Success' : 'Failure'}`
  )
}

export function trackNavigation(from: string, to: string): void {
  trackEvent('Navigation', 'Route Change', `${from} -> ${to}`)
}

export function trackUserInteraction(element: string, action: string): void {
  trackEvent('User Interaction', action, element)
}
