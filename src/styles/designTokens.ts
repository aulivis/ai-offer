/**
 * Design Tokens
 * 
 * Centralized design tokens for the application.
 * These tokens are used across components to ensure consistency.
 * 
 * This file exports spacing, typography, and animation utilities
 * that can be used throughout the application.
 */

export * from './spacing';
export * from './typography';
export * from './animations';

/**
 * Design system version
 */
export const DESIGN_SYSTEM_VERSION = '1.0.0';

/**
 * Base unit for spacing calculations
 */
export const BASE_UNIT = 4; // 4px = 0.25rem

/**
 * Breakpoints (matching Tailwind defaults)
 */
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Z-index scale for consistent layering
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

