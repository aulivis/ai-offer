import { randomUUID } from 'crypto';
import { sanitizeLogObject, sanitizeError, sanitizeLogString } from './sanitizeLogs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
};

class Logger {
  private context: LogContext = {};

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  private formatMessage(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    // Sanitize all log data to prevent sensitive data leakage
    const sanitizedContext = sanitizeLogObject(this.context);
    const sanitizedExtra = extra ? sanitizeLogObject(extra) : {};
    const sanitizedMessage = sanitizeLogString(message);

    const logEntry = {
      timestamp,
      level,
      message: sanitizedMessage,
      ...sanitizedContext,
      ...sanitizedExtra,
    };

    // In production, use structured logging
    // In development, use console for readability
    if (process.env.NODE_ENV === 'production') {
      const jsonString = JSON.stringify(logEntry);
      switch (level) {
        case 'debug':
        case 'info':
          console.info(jsonString);
          break;
        case 'warn':
          console.warn(jsonString);
          break;
        case 'error':
          console.error(jsonString);
          break;
      }
    } else {
      // Development: pretty print
      switch (level) {
        case 'debug':
          console.debug(`[${timestamp}] DEBUG:`, message, logEntry);
          break;
        case 'info':
          console.info(`[${timestamp}] INFO:`, message, logEntry);
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
    // Sanitize error information to prevent sensitive data leakage
    const sanitizedError = error !== undefined ? sanitizeError(error) : undefined;
    const errorData = sanitizedError
      ? {
          error: {
            name: sanitizedError.name,
            message: sanitizedError.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : sanitizedError.stack,
          },
        }
      : {};

    this.formatMessage('error', message, { ...errorData, ...extra });
  }
}

/**
 * Creates a logger instance with request context.
 * Use this in API routes to get structured logging with request IDs.
 */
export function createLogger(requestId?: string): Logger {
  const logger = new Logger();
  if (requestId) {
    logger.setContext({ requestId });
  } else {
    logger.setContext({ requestId: randomUUID() });
  }
  return logger;
}

/**
 * Global logger for use outside of request context.
 */
export const logger = new Logger();
