/**
 * Animation Utility System
 *
 * Provides consistent animations that respect prefers-reduced-motion.
 * All animations should check for reduced motion preference and provide
 * alternatives or disable animations when needed.
 *
 * @module animations
 *
 * @example
 * ```tsx
 * import {
 *   getAnimationDuration,
 *   getAnimationStyle,
 *   useReducedMotion
 * } from '@/styles/animations';
 * import { useReducedMotion } from '@/hooks/useReducedMotion';
 *
 * function MyComponent() {
 *   const reducedMotion = useReducedMotion();
 *   const duration = getAnimationDuration('smooth', true);
 *
 *   return (
 *     <div style={getAnimationStyle('smooth', 'easeOut', true)}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 *
 * Usage:
 * - Use animation classes in Tailwind: `transition-all duration-300`
 * - Use animation utilities in inline styles with reduced motion support
 * - Use animation hooks for complex animations
 */

/**
 * Animation duration scale (in milliseconds)
 */
export const ANIMATION_DURATION = {
  /** 75ms - Instant feedback (buttons, toggles) */
  instant: 75,
  /** 150ms - Quick transitions (hover states) */
  fast: 150,
  /** 200ms - Standard transitions (default) */
  base: 200,
  /** 300ms - Smooth transitions (modals, drawers) */
  smooth: 300,
  /** 500ms - Slow transitions (page transitions) */
  slow: 500,
  /** 1000ms - Very slow transitions (complex animations) */
  slower: 1000,
} as const;

/**
 * Animation easing functions
 */
export const ANIMATION_EASING = {
  /** Linear - Constant speed */
  linear: 'linear',
  /** Ease in - Slow start */
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Ease out - Slow end */
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Ease in-out - Slow start and end */
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Spring-like - Natural motion */
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * Animation delay scale (in milliseconds)
 */
export const ANIMATION_DELAY = {
  none: 0,
  short: 50,
  base: 100,
  medium: 200,
  long: 300,
} as const;

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration respecting reduced motion preference
 * Returns 0 if user prefers reduced motion
 */
export function getAnimationDuration(
  duration: keyof typeof ANIMATION_DURATION = 'base',
  respectReducedMotion = true,
): number {
  if (respectReducedMotion && prefersReducedMotion()) {
    return 0;
  }
  return ANIMATION_DURATION[duration];
}

/**
 * Get animation style object respecting reduced motion
 */
export function getAnimationStyle(
  duration: keyof typeof ANIMATION_DURATION = 'base',
  easing: keyof typeof ANIMATION_EASING = 'easeInOut',
  respectReducedMotion = true,
): React.CSSProperties {
  const animDuration = getAnimationDuration(duration, respectReducedMotion);

  return {
    transitionDuration: `${animDuration}ms`,
    transitionTimingFunction: ANIMATION_EASING[easing],
  };
}

/**
 * Common animation patterns
 */
export const ANIMATION_PATTERNS = {
  /** Fade in animation */
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: 'base' as const,
    easing: 'easeOut' as const,
  },
  /** Fade out animation */
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: 'base' as const,
    easing: 'easeIn' as const,
  },
  /** Slide up animation (for modals, bottom sheets) */
  slideUp: {
    from: { transform: 'translateY(100%)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
    duration: 'smooth' as const,
    easing: 'easeOut' as const,
  },
  /** Slide down animation */
  slideDown: {
    from: { transform: 'translateY(-100%)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
    duration: 'smooth' as const,
    easing: 'easeOut' as const,
  },
  /** Scale up animation (for buttons, cards) */
  scaleUp: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
    duration: 'base' as const,
    easing: 'easeOut' as const,
  },
  /** Scale down animation */
  scaleDown: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.95)', opacity: 0 },
    duration: 'fast' as const,
    easing: 'easeIn' as const,
  },
} as const;

/**
 * Animation CSS classes for common patterns
 * These can be used in Tailwind with the @apply directive or as utility classes
 */
export const ANIMATION_CLASSES = {
  /** Fade in on mount */
  fadeIn: '@media (prefers-reduced-motion: no-preference) { animation: fadeIn 200ms ease-out; }',
  /** Fade out on unmount */
  fadeOut: '@media (prefers-reduced-motion: no-preference) { animation: fadeOut 200ms ease-in; }',
  /** Slide up animation */
  slideUp: '@media (prefers-reduced-motion: no-preference) { animation: slideUp 300ms ease-out; }',
  /** Scale up animation */
  scaleUp: '@media (prefers-reduced-motion: no-preference) { animation: scaleUp 200ms ease-out; }',
} as const;

/**
 * Keyframes for common animations
 */
export const ANIMATION_KEYFRAMES = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scaleUp {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes scaleDown {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.95);
    opacity: 0;
  }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

/**
 * React hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // This would be used in a React component
  // For now, we provide a utility function
  return prefersReducedMotion();
}
