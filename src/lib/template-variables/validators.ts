/**
 * Validation functions for template variables
 *
 * Provides type-safe validators for different variable types
 */

import type { VariableType } from './types';

/**
 * Validates a hex color value
 */
export function isValidHexColor(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexPattern.test(value);
}

/**
 * Validates a URL
 */
export function isValidUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an email address
 */
export function isValidEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value);
}

/**
 * Validates a date string (ISO format)
 */
export function isValidDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates a string array
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Validates a number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Validates a boolean
 */
export function isValidBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Get validator function for a variable type
 */
export function getValidatorForType(type: VariableType): ((value: unknown) => boolean) | undefined {
  switch (type) {
    case 'string':
      return (value) => typeof value === 'string';
    case 'number':
      return isValidNumber;
    case 'boolean':
      return isValidBoolean;
    case 'date':
      return isValidDate;
    case 'url':
      return isValidUrl;
    case 'email':
      return isValidEmail;
    case 'color':
      return isValidHexColor;
    case 'array':
      return (value) => Array.isArray(value);
    case 'object':
      return (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return undefined;
  }
}
