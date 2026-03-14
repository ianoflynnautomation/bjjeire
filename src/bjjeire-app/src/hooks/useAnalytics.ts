import { useEffect } from 'react'
import { initGA } from '@/utils/telemetry'

export function useAnalytics(): void {
  useEffect(() => {
    if (import.meta.env.PROD) {
      initGA(
        (import.meta.env.VITE_APP_GA_MEASUREMENT_ID as string | undefined) ??
          'G-XXXXXXXXXX'
      )
    }
  }, [])
}
