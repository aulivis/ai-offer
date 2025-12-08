/**
 * Design Tokens
 *
 * Centralized design tokens for the application.
 * These tokens are used across components to ensure consistency.
 *
 * This file exports spacing, typography, and animation utilities
 * that can be used throughout the application.
 *
 * @module designTokens
 *
 * @example
 * ```tsx
 * import { SPACING_SCALE, TYPOGRAPHY_SCALE, ANIMATION_DURATION } from '@/styles/designTokens';
 *
 * // Use spacing
 * const padding = SPACING_SCALE.md; // '1rem'
 *
 * // Use typography
 * const h1Style = TYPOGRAPHY_SCALE.h1; // { size: '3rem', lineHeight: '1.2', ... }
 *
 * // Use animations
 * const duration = ANIMATION_DURATION.base; // 200
 * ```
 */

export * from './spacing';
export * from './typography';
export * from './animations';
export * from './fluidTypography';
export * from './containerQueries';

// Removed unused exports: DESIGN_SYSTEM_VERSION, BASE_UNIT, BREAKPOINTS, Z_INDEX
// These were not imported anywhere in the codebase
