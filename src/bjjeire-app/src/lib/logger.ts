class Logger {
  warn(message: string, context?: unknown): void {
    console.warn(message, ...(context === undefined ? [] : [context]))
  }

  error(message: string, context?: unknown): void {
    console.error(message, ...(context === undefined ? [] : [context]))
  }
}

export const logger = new Logger()
