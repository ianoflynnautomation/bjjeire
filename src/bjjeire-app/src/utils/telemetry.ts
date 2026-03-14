import ReactGA from 'react-ga4'

export const initGA = (measurementId: string): void => {
  ReactGA.initialize(measurementId)
}

export const trackPageView = (path: string): void => {
  ReactGA.send({ hitType: 'pageview', page: path })
}

export const trackEvent = (
  category: string,
  action: string,
  label?: string
): void => {
  ReactGA.event({
    category,
    action,
    label,
  })
}

export const trackFormSubmission = (
  formName: string,
  success: boolean
): void => {
  trackEvent(
    'Form',
    'Submit',
    `${formName} - ${success ? 'Success' : 'Failure'}`
  )
}

export const trackNavigation = (from: string, to: string): void => {
  trackEvent('Navigation', 'Route Change', `${from} -> ${to}`)
}

export const trackUserInteraction = (element: string, action: string): void => {
  trackEvent('User Interaction', action, element)
}
