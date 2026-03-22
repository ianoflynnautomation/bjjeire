import type { CloudflareZaraz } from '@/types/cloudflare'

function send(eventName: string, properties?: Record<string, string>): void {
  const zaraz = (globalThis as { zaraz?: CloudflareZaraz }).zaraz
  zaraz?.track(eventName, properties)
}

export function trackPageView(_path: string): void {}

export function trackEvent(
  category: string,
  action: string,
  label?: string
): void {
  send('custom_event', { category, action, ...(label ? { label } : {}) })
}

export function trackFormSubmission(formName: string, success: boolean): void {
  send('form_submit', {
    form: formName,
    result: success ? 'success' : 'failure',
  })
}

export function trackNavigation(from: string, to: string): void {
  send('navigation', { from, to })
}

export function trackUserInteraction(element: string, action: string): void {
  send('user_interaction', { element, action })
}
