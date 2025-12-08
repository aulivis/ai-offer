import { createHash, randomUUID } from 'crypto';
import { createLogger } from '@/lib/logger';

export type RequestLogContext = {
  requestId: string;
  emailHash?: string;
};

type LogAttributes = Record<string, unknown>;

function _sanitizeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashEmailIdentifier(email: string) {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

export type RequestLogger = {
  context(): RequestLogContext;
  setEmail(email: string): string;
  info(message: string, attributes?: LogAttributes): void;
  warn(message: string, attributes?: LogAttributes): void;
  error(message: string, error?: unknown, attributes?: LogAttributes): void;
};

export function createAuthRequestLogger(
  initialContext?: Partial<RequestLogContext>,
): RequestLogger {
  const context: RequestLogContext = {
    requestId: initialContext?.requestId ?? randomUUID(),
  };

  if (initialContext?.emailHash) {
    context.emailHash = initialContext.emailHash;
  }

  // Create a logger instance with request context
  const logger = createLogger(context.requestId);
  logger.setContext({
    ...(context.emailHash ? { emailHash: context.emailHash } : {}),
  });

  return {
    context: () => ({ ...context }),
    setEmail(email: string) {
      const emailHash = hashEmailIdentifier(email);
      context.emailHash = emailHash;
      logger.setContext({ emailHash });
      return emailHash;
    },
    info(message: string, attributes?: LogAttributes) {
      logger.info(message, attributes);
    },
    warn(message: string, attributes?: LogAttributes) {
      logger.warn(message, attributes);
    },
    error(message: string, error?: unknown, attributes?: LogAttributes) {
      logger.error(message, error, attributes);
    },
  };
}
