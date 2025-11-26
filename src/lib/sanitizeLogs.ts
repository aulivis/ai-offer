/**
 * Utilities for sanitizing sensitive data from logs
 *
 * Prevents accidental logging of passwords, tokens, API keys, and other sensitive information.
 */

/**
 * Patterns for identifying sensitive data in strings
 */
const SENSITIVE_PATTERNS = [
  /password[=:]\s*['"]?([^'";\s]{3,})['"]?/gi,
  /token[=:]\s*['"]?([^'";\s]{8,})['"]?/gi,
  /ap[_-]?key[=:]\s*['"]?([^'";\s]{10,})['"]?/gi,
  /secret[=:]\s*['"]?([^'";\s]{8,})['"]?/gi,
  /authorization[=:]\s*bearer\s+([^\s'";]+)/gi,
  /x-api-key[=:]\s*([^\s'";]+)/gi,
  /access[_-]?token[=:]\s*['"]?([^'";\s]{10,})['"]?/gi,
  /refresh[_-]?token[=:]\s*['"]?([^'";\s]{10,})['"]?/gi,
  /session[_-]?id[=:]\s*['"]?([^'";\s]{16,})['"]?/gi,
  /csrf[_-]?token[=:]\s*['"]?([^'";\s]{10,})['"]?/gi,
] as const;

const REDACTED = '[REDACTED]';

/**
 * Redacts sensitive data from a string
 *
 * @param input - The string to sanitize
 * @returns Sanitized string with sensitive data replaced
 */
export function sanitizeLogString(input: string): string {
  let sanitized = input;

  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match, value) => {
      // Replace the matched value with [REDACTED]
      return match.replace(value, REDACTED);
    });
  }

  return sanitized;
}

/**
 * Sanitizes sensitive fields from an object
 *
 * @param obj - Object to sanitize
 * @param fieldsToRedact - Optional list of field names to always redact
 * @returns New object with sensitive fields redacted
 */
export function sanitizeLogObject<T extends Record<string, unknown>>(
  obj: T,
  fieldsToRedact: string[] = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'sessionId',
    'session_id',
    'csrfToken',
    'csrf_token',
    'secret',
    'apikey',
    'authorization',
    'auth',
  ],
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();

    // Check if key matches any sensitive field pattern
    const shouldRedact = fieldsToRedact.some((field) => keyLower.includes(field.toLowerCase()));

    if (shouldRedact) {
      sanitized[key] = REDACTED;
    } else if (typeof value === 'string') {
      // Sanitize string values
      sanitized[key] = sanitizeLogString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeLogObject(value as Record<string, unknown>, fieldsToRedact);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitizes error objects for logging
 *
 * @param error - Error to sanitize
 * @returns Sanitized error information
 */
export function sanitizeError(error: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeLogString(error.message),
      ...(error.stack && { stack: sanitizeLogString(error.stack) }),
    };
  }

  return {
    name: 'Unknown',
    message: sanitizeLogString(String(error)),
  };
}

/**
 * Checks if a string contains potentially sensitive data
 *
 * @param input - String to check
 * @returns true if sensitive data detected
 */
export function containsSensitiveData(input: string): boolean {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
}
