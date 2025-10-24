import { createHash, randomUUID } from 'crypto';

export type RequestLogContext = {
  requestId: string;
  emailHash?: string;
};

type LogAttributes = Record<string, unknown>;

type LogLevel = 'info' | 'warn';

function sanitizeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function emit(
  level: LogLevel,
  message: string,
  context: RequestLogContext,
  attributes?: LogAttributes,
) {
  const payload = { ...context, ...(attributes ?? {}) };

  if (level === 'info') {
    console.info(message, payload);
  } else {
    console.warn(message, payload);
  }
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

  return {
    context: () => ({ ...context }),
    setEmail(email: string) {
      const emailHash = hashEmailIdentifier(email);
      context.emailHash = emailHash;
      return emailHash;
    },
    info(message: string, attributes?: LogAttributes) {
      emit('info', message, context, attributes);
    },
    warn(message: string, attributes?: LogAttributes) {
      emit('warn', message, context, attributes);
    },
    error(message: string, error?: unknown, attributes?: LogAttributes) {
      const payload: RequestLogContext & LogAttributes & { error?: unknown } = {
        ...context,
        ...(attributes ?? {}),
      };
      if (error !== undefined) {
        payload.error = sanitizeError(error);
      }
      console.error(message, payload);
    },
  };
}
