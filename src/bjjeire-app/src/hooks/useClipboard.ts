import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface UseClipboardResult {
  copy: (text: string) => Promise<void>
  copied: boolean
}

export function useClipboard(resetMs = 2000): UseClipboardResult {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }
    const id = globalThis.setTimeout(() => setCopied(false), resetMs)
    return (): void => globalThis.clearTimeout(id)
  }, [copied, resetMs])

  const copy = useCallback(async (text: string): Promise<void> => {
    if (!navigator.clipboard) {
      logger.warn('Clipboard API not available.')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch (err) {
      logger.error('Failed to copy text', err)
    }
  }, [])

  return { copy, copied }
}
