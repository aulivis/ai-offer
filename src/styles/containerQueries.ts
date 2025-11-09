/**
 * Container Queries Utilities
 * 
 * Provides utilities for using CSS container queries in components.
 * Container queries allow components to respond to their container's size
 * rather than the viewport size, enabling more flexible responsive design.
 * 
 * @module containerQueries
 * 
 * @example
 * ```tsx
 * import { Container } from '@/components/ui/Container';
 * 
 * <Container className="container-card">
 *   <div className="container-query-responsive">
 *     Content that adapts to container size
 *   </div>
 * </Container>
 * ```
 */

/**
 * Container query breakpoints
 * These can be used with @container queries in CSS
 */
export const CONTAINER_BREAKPOINTS = {
  /** Small container (320px) */
  sm: '320px',
  /** Medium container (640px) */
  md: '640px',
  /** Large container (1024px) */
  lg: '1024px',
  /** Extra large container (1280px) */
  xl: '1280px',
} as const;

/**
 * Container query names
 * Use these to create named container contexts
 */
export const CONTAINER_NAMES = {
  /** Card container */
  card: 'card',
  /** Sidebar container */
  sidebar: 'sidebar',
  /** Grid container */
  grid: 'grid',
  /** Modal container */
  modal: 'modal',
} as const;

/**
 * Get container query string
 * 
 * @param minWidth - Minimum width for the container query
 * @param containerName - Optional container name
 * @returns Container query string
 * 
 * @example
 * ```tsx
 * const query = getContainerQuery('640px', 'card');
 * // Returns: '@container card (min-width: 640px)'
 * ```
 */
export function getContainerQuery(minWidth: string, containerName?: string): string {
  if (containerName) {
    return `@container ${containerName} (min-width: ${minWidth})`;
  }
  return `@container (min-width: ${minWidth})`;
}

/**
 * Container query utilities as CSS classes
 * These can be used with Tailwind's container query plugin if available
 */
export const CONTAINER_QUERY_CLASSES = {
  /** Container query for small screens */
  'container-sm': '@container (min-width: 320px)',
  /** Container query for medium screens */
  'container-md': '@container (min-width: 640px)',
  /** Container query for large screens */
  'container-lg': '@container (min-width: 1024px)',
  /** Container query for extra large screens */
  'container-xl': '@container (min-width: 1280px)',
} as const;

