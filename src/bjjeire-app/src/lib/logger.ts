type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function configuredLevel(): LogLevel {
  const raw = (import.meta.env.VITE_APP_LOG_LEVEL ?? '').toLowerCase()
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw
  }
  return import.meta.env.DEV ? 'debug' : 'warn'
}

const MIN_WEIGHT = LEVEL_WEIGHT[configuredLevel()]

class Logger {
  debug(message: string, context?: unknown): void {
    this.emit('debug', message, context)
  }

  info(message: string, context?: unknown): void {
    this.emit('info', message, context)
  }

  warn(message: string, context?: unknown): void {
    this.emit('warn', message, context)
  }

  error(message: string, context?: unknown): void {
    this.emit('error', message, context)
  }

  private emit(level: LogLevel, message: string, context?: unknown): void {
    if (LEVEL_WEIGHT[level] < MIN_WEIGHT) {
      return
    }

    const args = [
      `[bjjeire] ${message}`,
      ...(context === undefined ? [] : [context]),
    ] as const

    switch (level) {
      case 'debug':
        console.debug(...args)
        break
      case 'info':
        console.info(...args)
        break
      case 'warn':
        console.warn(...args)
        break
      case 'error':
        console.error(...args)
        break
    }
  }
}

export const logger = new Logger()
