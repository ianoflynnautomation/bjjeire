export function initCloudflareAnalytics(): void {
  if (!import.meta.env.PROD) {
    return
  }

  const token = import.meta.env.VITE_APP_CF_BEACON_TOKEN as string | undefined
  if (!token) {
    return
  }

  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset['cfBeacon'] = JSON.stringify({ token, spa: true })
  document.head.appendChild(script)
}
