/**
 * Layout utilities for consistent spacing and grid systems
 */

/**
 * Standardized spacing scale
 */
export const SPACING_SCALE = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.75rem', // 44px
  '3xl': '3.5rem',  // 56px
} as const;

/**
 * Grid system utilities
 */
export const GRID_SYSTEM = {
  columns: 12,
  gutter: SPACING_SCALE.md,
  maxWidth: '760px',
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
  },
} as const;

/**
 * Generate grid CSS
 */
export function generateGridCSS(): string {
  return `
    .offer-grid {
      display: grid;
      grid-template-columns: repeat(${GRID_SYSTEM.columns}, 1fr);
      gap: ${GRID_SYSTEM.gutter};
      max-width: ${GRID_SYSTEM.maxWidth};
      margin: 0 auto;
    }
    
    .offer-grid--2 {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .offer-grid--3 {
      grid-template-columns: repeat(3, 1fr);
    }
    
    .offer-grid--4 {
      grid-template-columns: repeat(4, 1fr);
    }
    
    @media (max-width: ${GRID_SYSTEM.breakpoints.md}) {
      .offer-grid--2,
      .offer-grid--3,
      .offer-grid--4 {
        grid-template-columns: 1fr;
      }
    }
  `;
}

