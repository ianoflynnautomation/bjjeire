import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { logger as loggerInstance } from '@/lib/logger'

// The logger captures its level at module load, so each test stubs the env
// first and then imports a fresh copy.
async function loadLogger(): Promise<typeof loggerInstance> {
  vi.resetModules()
  const { logger } = await import('@/lib/logger')
  return logger
}

beforeEach(() => {
  vi.unstubAllEnvs()
})

describe('logger', () => {
  it('given a debug log level, when each level is logged, then it routes to the matching console method with the [bjjeire] prefix', async () => {
    vi.stubEnv('VITE_APP_LOG_LEVEL', 'debug')
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logger = await loadLogger()

    logger.debug('debug message')
    logger.info('info message')
    logger.warn('warn message')
    logger.error('error message')

    expect(debugSpy).toHaveBeenCalledExactlyOnceWith('[bjjeire] debug message')
    expect(infoSpy).toHaveBeenCalledExactlyOnceWith('[bjjeire] info message')
    expect(warnSpy).toHaveBeenCalledExactlyOnceWith('[bjjeire] warn message')
    expect(errorSpy).toHaveBeenCalledExactlyOnceWith('[bjjeire] error message')
  })

  it('given an optional context object, when a message is logged, then the context is passed only when provided', async () => {
    vi.stubEnv('VITE_APP_LOG_LEVEL', 'debug')
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = await loadLogger()

    logger.info('no context')
    logger.info('with context', { requestId: 'abc' })

    expect(infoSpy).toHaveBeenNthCalledWith(1, '[bjjeire] no context')
    expect(infoSpy).toHaveBeenNthCalledWith(2, '[bjjeire] with context', {
      requestId: 'abc',
    })
  })

  it('given an error log level, when lower-level messages are logged, then they are suppressed', async () => {
    vi.stubEnv('VITE_APP_LOG_LEVEL', 'error')
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logger = await loadLogger()

    logger.debug('hidden')
    logger.warn('hidden')
    logger.error('visible')

    expect(debugSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledExactlyOnceWith('[bjjeire] visible')
  })

  it('given an invalid configured level in dev, when a debug message is logged, then it is shown (debug fallback)', async () => {
    vi.stubEnv('VITE_APP_LOG_LEVEL', 'verbose')
    vi.stubEnv('DEV', true)
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const logger = await loadLogger()

    logger.debug('dev fallback')

    expect(debugSpy).toHaveBeenCalledExactlyOnceWith('[bjjeire] dev fallback')
  })

  it('given no valid level outside dev, when messages are logged, then only warn and above are shown', async () => {
    vi.stubEnv('VITE_APP_LOG_LEVEL', '')
    vi.stubEnv('DEV', false)
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logger = await loadLogger()

    logger.info('hidden')
    logger.warn('visible')

    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledExactlyOnceWith('[bjjeire] visible')
  })
})
