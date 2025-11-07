import { z } from 'zod';
import { t } from '@/copy';

/**
 * Common validation schemas for API routes
 * These schemas can be reused across multiple endpoints
 */

/**
 * Validates a UUID string
 */
export const uuidSchema = z.string().uuid('Invalid UUID format.');

/**
 * Validates a date string in ISO format (YYYY-MM-DD)
 */
export const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.');

/**
 * Validates an optional date string in ISO format
 */
export const optionalDateSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  },
  dateSchema.optional(),
);

/**
 * Validates a device ID (alphanumeric, max 100 chars)
 */
export const deviceIdSchema = z
  .string()
  .trim()
  .min(1, 'Device ID is required.')
  .max(100, 'Device ID must be 100 characters or less.')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Device ID contains invalid characters.');

/**
 * Validates an optional device ID
 */
export const optionalDeviceIdSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  },
  deviceIdSchema.optional(),
);

/**
 * Validates a URL string
 */
export const urlSchema = (message?: string) =>
  z.string().trim().url(message || t('validation.urlInvalid'));

/**
 * Validates an optional URL string
 */
export const optionalUrlSchema = (message?: string) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === '') {
        return undefined;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      }
      return undefined;
    },
    urlSchema(message).optional(),
  );

/**
 * Validates a non-negative integer
 */
export const nonNegativeIntegerSchema = z
  .number()
  .int('Must be an integer.')
  .min(0, 'Must be non-negative.');

/**
 * Validates an optional non-negative integer
 */
export const optionalNonNegativeIntegerSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return undefined;
  },
  nonNegativeIntegerSchema.optional(),
);

/**
 * Validates a trimmed string with optional min/max length
 */
export const trimmedStringSchema = (minLength = 1, maxLength?: number) => {
  let schema = z.string().trim().min(minLength, t('validation.required'));
  if (maxLength !== undefined) {
    schema = schema.max(maxLength, `Must be ${maxLength} characters or less.`);
  }
  return schema;
};

/**
 * Validates an optional trimmed string
 */
export const optionalTrimmedStringSchema = (maxLength?: number) => {
  return z.preprocess(
    (value) => {
      if (value === null || value === undefined) {
        return undefined;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      }
      return undefined;
    },
    maxLength !== undefined
      ? z.string().max(maxLength, `Must be ${maxLength} characters or less.`).optional()
      : z.string().optional(),
  );
};

/**
 * Validates query parameters for usage endpoint
 */
export const usageQuerySchema = z.object({
  period_start: optionalDateSchema,
  device_id: optionalDeviceIdSchema,
});

/**
 * Validates OAuth redirect URL
 */
export const oauthRedirectSchema = optionalUrlSchema('Redirect URL must be a valid URL.');





