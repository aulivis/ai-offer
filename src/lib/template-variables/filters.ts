/**
 * Template filters
 *
 * Provides filter functions for template variable formatting
 * Similar to Shopify Liquid filters
 */

import { logger } from '@/lib/logger';

/**
 * Format a date value
 */
export function dateFilter(value: unknown, formatArg?: unknown): string {
  if (!value) return '';

  let date: Date;
  if (typeof value === 'string') {
    date = new Date(value);
  } else if (value instanceof Date) {
    date = value;
  } else {
    return String(value);
  }

  if (isNaN(date.getTime())) {
    return String(value);
  }

  const format = typeof formatArg === 'string' ? formatArg : undefined;

  // Default format: ISO date
  if (!format || format === 'iso') {
    return date.toISOString().split('T')[0] || '';
  }

  // Custom format parsing (simplified)
  // Supports: %Y (year), %m (month), %d (day), %H (hour), %M (minute)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return format
    .replace(/%Y/g, String(year))
    .replace(/%m/g, month)
    .replace(/%d/g, day)
    .replace(/%H/g, hour)
    .replace(/%M/g, minute);
}

/**
 * Format a number as currency
 */
export function moneyFilter(value: unknown, currencyArg?: unknown): string {
  if (typeof value !== 'number') {
    return String(value || '');
  }

  const currency = typeof currencyArg === 'string' ? currencyArg : 'HUF';

  // Format number with thousand separators
  const formatted = new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: currency === 'HUF' ? 'HUF' : 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return formatted;
}

/**
 * Truncate a string
 */
export function truncateFilter(value: unknown, lengthArg?: unknown, suffixArg?: unknown): string {
  if (typeof value !== 'string') {
    return String(value || '');
  }

  const length = typeof lengthArg === 'number' ? lengthArg : 50;
  const suffix = typeof suffixArg === 'string' ? suffixArg : '...';

  if (value.length <= length) {
    return value;
  }

  return value.slice(0, length) + suffix;
}

/**
 * Join an array with a separator
 */
export function joinFilter(value: unknown, separatorArg?: unknown): string {
  if (!Array.isArray(value)) {
    return String(value || '');
  }

  const separator = typeof separatorArg === 'string' ? separatorArg : ', ';

  return value.map(String).join(separator);
}

/**
 * Capitalize first letter
 */
export function capitalizeFilter(value: unknown): string {
  if (typeof value !== 'string') {
    return String(value || '');
  }

  if (value.length === 0) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Convert to uppercase
 */
export function upcaseFilter(value: unknown): string {
  return String(value || '').toUpperCase();
}

/**
 * Convert to lowercase
 */
export function downcaseFilter(value: unknown): string {
  return String(value || '').toLowerCase();
}

/**
 * Get first element of array
 */
export function firstFilter(value: unknown): unknown {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  return value[0];
}

/**
 * Get last element of array
 */
export function lastFilter(value: unknown): unknown {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  return value[value.length - 1];
}

/**
 * Get array size
 */
export function sizeFilter(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (typeof value === 'string') {
    return value.length;
  }
  return 0;
}

/**
 * Filter registry
 */
type FilterFunction = (value: unknown, ...args: unknown[]) => unknown;

export const FILTERS: Record<string, FilterFunction> = {
  date: dateFilter,
  money: moneyFilter,
  truncate: truncateFilter,
  join: joinFilter,
  capitalize: capitalizeFilter,
  upcase: upcaseFilter,
  downcase: downcaseFilter,
  first: firstFilter,
  last: lastFilter,
  size: sizeFilter,
};

/**
 * Apply a filter to a value
 */
export function applyFilter(filterName: string, value: unknown, ...args: unknown[]): unknown {
  const filter = FILTERS[filterName];
  if (!filter) {
    logger.warn(`Unknown filter: ${filterName}`, { filterName, argsCount: args.length });
    return value;
  }

  try {
    return filter(value, ...args);
  } catch (error) {
    logger.warn(`Filter ${filterName} failed`, { error, filterName, argsCount: args.length });
    return value;
  }
}
