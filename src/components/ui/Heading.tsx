'use client';

import * as React from 'react';
import { getTypography, type TypographyScale } from '@/styles/typography';
import { getFluidTypography, type FluidTypographyScale } from '@/styles/fluidTypography';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type HeadingProps = React.ComponentPropsWithoutRef<'h1'> & {
  /** Heading level (h1-h6) */
  level?: HeadingLevel;
  /** Typography scale key (overrides level-based styling) */
  scale?: TypographyScale;
  /** Visual size (overrides level/scale) */
  size?: 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Use fluid/responsive typography (default: false) */
  fluid?: boolean;
  /** Custom className */
  className?: string;
  /** Children */
  children: React.ReactNode;
};

/**
 * Heading component with consistent typography scale
 *
 * Provides consistent heading styles based on the typography scale.
 * Automatically maps heading levels to appropriate typography styles.
 *
 * @example
 * ```tsx
 * <Heading level="h1">Page Title</Heading>
 * <Heading level="h2" size="h1">Large Section Title</Heading>
 * <H1>Convenience component</H1>
 * <H2>Another convenience component</H2>
 * ```
 */
export function Heading({
  level = 'h2',
  scale,
  size,
  fluid = false,
  className = '',
  children,
  ...props
}: HeadingProps) {
  // Determine typography scale based on level or size
  const typographyKey =
    scale ||
    (() => {
      if (size) {
        return size === 'display' ? 'display' : size;
      }
      // Map heading level to typography scale
      switch (level) {
        case 'h1':
          return 'h1';
        case 'h2':
          return 'h2';
        case 'h3':
          return 'h3';
        case 'h4':
          return 'h4';
        case 'h5':
          return 'h5';
        case 'h6':
          return 'h6';
        default:
          return 'h2';
      }
    })();

  // Use fluid or fixed typography based on prop
  const typography = fluid
    ? getFluidTypography(typographyKey as FluidTypographyScale)
    : getTypography(typographyKey as TypographyScale);

  // Use the appropriate HTML heading element
  const Component = level;

  const style: React.CSSProperties = {
    fontSize: typography.size,
    lineHeight: typography.lineHeight,
    fontWeight: typography.fontWeight,
    letterSpacing: typography.letterSpacing,
  };

  const cls = ['text-fg', className].filter(Boolean).join(' ');

  return (
    <Component className={cls} style={style} {...props}>
      {children}
    </Component>
  );
}

/**
 * Convenience components for each heading level
 */
export const H1 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, 'level'>>(
  (props, ref) => <Heading {...props} level="h1" ref={ref} />,
);
H1.displayName = 'H1';

export const H2 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, 'level'>>(
  (props, ref) => <Heading {...props} level="h2" ref={ref} />,
);
H2.displayName = 'H2';

export const H3 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, 'level'>>(
  (props, ref) => <Heading {...props} level="h3" ref={ref} />,
);
H3.displayName = 'H3';

export const H4 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, 'level'>>(
  (props, ref) => <Heading {...props} level="h4" ref={ref} />,
);
H4.displayName = 'H4';

export const H5 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, 'level'>>(
  (props, ref) => <Heading {...props} level="h5" ref={ref} />,
);
H5.displayName = 'H5';

export const H6 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, 'level'>>(
  (props, ref) => <Heading {...props} level="h6" ref={ref} />,
);
H6.displayName = 'H6';
