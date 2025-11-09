'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { LoadingSpinner } from './LoadingSpinner';

type LinkProps = React.ComponentPropsWithoutRef<typeof NextLink> & {
  /** Show loading state (disables link and shows spinner) */
  loading?: boolean;
  /** Link variant style */
  variant?: 'default' | 'primary' | 'muted' | 'underline';
  /** Link size */
  size?: 'sm' | 'md' | 'lg';
  /** External link (opens in new tab) */
  external?: boolean;
};

const variantClasses = {
  default: 'text-fg hover:text-primary transition-colors',
  primary: 'text-primary hover:text-primary/80 transition-colors font-medium',
  muted: 'text-fg-muted hover:text-fg transition-colors',
  underline: 'text-fg underline hover:text-primary transition-colors',
};

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

/**
 * Link component with loading state and variant support
 * 
 * Wraps Next.js Link component with additional styling and loading state support.
 * 
 * @example
 * ```tsx
 * <Link href="/dashboard" variant="primary" loading={isNavigating}>
 *   Go to Dashboard
 * </Link>
 * 
 * <Link href="/settings" variant="muted" size="sm">
 *   Settings
 * </Link>
 * 
 * <Link href="https://example.com" external>
 *   External Link
 * </Link>
 * ```
 */
export function Link({
  className = '',
  loading,
  variant = 'default',
  size = 'md',
  external,
  children,
  ...props
}: LinkProps) {
  const isDisabled = loading;
  
  // For external links, use regular <a> tag instead of Next.js Link
  if (external || (typeof props.href === 'string' && props.href.startsWith('http'))) {
    return (
      <a
        href={props.href as string}
        target="_blank"
        rel="noopener noreferrer"
        className={[
          'inline-flex items-center gap-2',
          variantClasses[variant],
          sizeClasses[size],
          loading ? 'cursor-wait opacity-60' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-busy={loading}
        aria-disabled={isDisabled}
        onClick={(e) => {
          if (loading || isDisabled) {
            e.preventDefault();
            return;
          }
        }}
      >
        {loading && <LoadingSpinner size="sm" aria-label="Loading" />}
        {children}
      </a>
    );
  }
  
  const cls = [
    'inline-flex items-center gap-2',
    variantClasses[variant],
    sizeClasses[size],
    loading ? 'cursor-wait opacity-60 pointer-events-none' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <NextLink
      {...props}
      className={cls}
      aria-busy={loading}
      aria-disabled={isDisabled}
      onClick={(e) => {
        if (loading || isDisabled) {
          e.preventDefault();
          return;
        }
        props.onClick?.(e);
      }}
    >
      {loading && <LoadingSpinner size="sm" aria-label="Loading" />}
      {children}
    </NextLink>
  );
}

