import ReactGA from 'react-ga4';

// Initialize Google Analytics
export const initGA = (measurementId: string) => {
  ReactGA.initialize(measurementId);
};

// Track page views
export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: "pageview", page: path });
};

// Track events
export const trackEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({
    category,
    action,
    label,
  });
};

// Track form submissions
export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent('Form', 'Submit', `${formName} - ${success ? 'Success' : 'Failure'}`);
};

// Track navigation
export const trackNavigation = (from: string, to: string) => {
  trackEvent('Navigation', 'Route Change', `${from} -> ${to}`);
};

// Track user interactions
export const trackUserInteraction = (element: string, action: string) => {
  trackEvent('User Interaction', action, element);
}; 