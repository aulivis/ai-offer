'use client';

/**
 * Client-side logger for use in React components.
 * Uses structured logging format similar to server-side logger.
 * In production, logs are sent to error tracking services if available.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = {
  userId?: string;
  component?: string;
  [key: string]: unknown;
};

class ClientLogger {
  private context: LogContext = {};

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  private formatMessage(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...extra,
    };

    // In production, send structured logs (can be extended to send to logging service)
    // In development, use console for readability
    if (process.env.NODE_ENV === 'production') {
      const jsonString = JSON.stringify(logEntry);
      switch (level) {
        case 'debug':
        case 'info':
          // In production, only log errors and warnings to console
          break;
        case 'warn':
          console.warn(jsonString);
          break;
        case 'error':
          console.error(jsonString);
          // Optionally send to error tracking service (e.g., Sentry)
          if (typeof window !== 'undefined' && (window as { Sentry?: unknown }).Sentry) {
            try {
              // Sentry will be available in production builds if configured
              interface SentryType {
                captureException?: (error: Error, context?: Record<string, unknown>) => void;
                captureMessage?: (message: string, context?: Record<string, unknown>) => void;
              }
              const Sentry = (window as { Sentry?: SentryType }).Sentry;
              if (Sentry && Sentry.captureException) {
                if (extra?.error instanceof Error) {
                  Sentry.captureException(extra.error, {
                    level: 'error',
                    extra: { message, ...this.context, ...extra },
                  });
                } else {
                  Sentry.captureMessage(message, {
                    level: 'error',
                    extra: { ...this.context, ...extra },
                  });
                }
              }
            } catch {
              // Ignore Sentry errors
            }
          }
          break;
      }
    } else {
      // Development: pretty print
      switch (level) {
        case 'debug':
          console.warn(`[${timestamp}] DEBUG:`, message, logEntry);
          break;
        case 'info':
          console.warn(`[${timestamp}] INFO:`, message, logEntry);
          break;
        case 'warn':
          console.warn(`[${timestamp}] WARN:`, message, logEntry);
          break;
        case 'error':
          console.error(`[${timestamp}] ERROR:`, message, logEntry);
          break;
      }
    }
  }

  debug(message: string, extra?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      this.formatMessage('debug', message, extra);
    }
  }

  info(message: string, extra?: Record<string, unknown>): void {
    this.formatMessage('info', message, extra);
  }

  warn(message: string, extra?: Record<string, unknown>): void {
    this.formatMessage('warn', message, extra);
  }

  error(message: string, error?: unknown, extra?: Record<string, unknown>): void {
    const errorData =
      error instanceof Error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
            },
          }
        : error !== undefined
          ? { error: String(error) }
          : {};

    this.formatMessage('error', message, { ...errorData, ...extra });
  }
}

/**
 * Creates a client logger instance with optional context.
 * Use this in React components for structured logging.
 */
export function createClientLogger(context?: LogContext): ClientLogger {
  const logger = new ClientLogger();
  if (context) {
    logger.setContext(context);
  }
  return logger;
}

/**
 * Global client logger for use outside of component context.
 */
export const clientLogger = new ClientLogger();
