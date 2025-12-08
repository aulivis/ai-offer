/**
 * Structured logger for Supabase Edge Functions (Deno runtime)
 * Provides structured logging with context (request ID, job ID, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = {
  requestId?: string;
  jobId?: string;
  userId?: string;
  functionName?: string;
  [key: string]: unknown;
};

class DenoLogger {
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

    // In production, use structured JSON logging
    // In development, use readable format
    const jsonString = JSON.stringify(logEntry);

    switch (level) {
      case 'debug':
        if (Deno.env.get('ENV') !== 'production') {
          console.log(`[${timestamp}] DEBUG:`, message, logEntry);
        }
        break;
      case 'info':
        console.log(jsonString);
        break;
      case 'warn':
        console.warn(jsonString);
        break;
      case 'error':
        console.error(jsonString);
        break;
    }
  }

  debug(message: string, extra?: Record<string, unknown>): void {
    if (Deno.env.get('ENV') !== 'production') {
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
              stack: Deno.env.get('ENV') === 'production' ? undefined : error.stack,
            },
          }
        : error !== undefined
          ? { error: String(error) }
          : {};

    this.formatMessage('error', message, { ...errorData, ...extra });
  }
}

/**
 * Creates a logger instance with context.
 * Use this in Supabase Edge Functions for structured logging.
 */
export function createDenoLogger(context?: LogContext): DenoLogger {
  const logger = new DenoLogger();
  if (context) {
    logger.setContext(context);
  }
  return logger;
}

/**
 * Global logger for use in Edge Functions.
 */
export const logger = new DenoLogger();
