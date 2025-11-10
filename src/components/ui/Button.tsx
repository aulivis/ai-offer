import * as React from 'react';
import { tokens } from '@/styles/tokens.preset';
import { LoadingSpinner } from './LoadingSpinner';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

type CSSVarStyle = React.CSSProperties & Record<string, string | undefined>;

const base = [
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
  'transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:scale-100',
].join(' ');

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'bg-[var(--btn-bg)] text-[var(--btn-fg)] enabled:hover:brightness-110 enabled:hover:scale-105 enabled:active:scale-95 transition-all duration-200',
  secondary: [
    'border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--btn-fg)]',
    'enabled:hover:border-[var(--btn-hover-border)] enabled:hover:bg-[var(--btn-hover-bg)] enabled:hover:scale-105 enabled:active:scale-95 transition-all duration-200',
  ].join(' '),
  ghost:
    'bg-transparent text-[var(--btn-fg)] enabled:hover:bg-[var(--btn-hover-bg)] enabled:hover:scale-105 enabled:active:scale-95 transition-all duration-200',
  danger:
    'bg-[var(--btn-bg)] text-[var(--btn-fg)] enabled:hover:brightness-110 enabled:hover:scale-105 enabled:active:scale-95 transition-all duration-200',
};

const variantStyles: Record<NonNullable<Props['variant']>, CSSVarStyle> = {
  primary: {
    '--btn-bg': tokens.colors.primary,
    '--btn-fg': tokens.colors.primaryInk,
  },
  secondary: {
    '--btn-bg': tokens.colors.bg,
    '--btn-fg': tokens.colors.fg,
    '--btn-border': tokens.colors.border,
    '--btn-hover-border': tokens.colors.fg,
    '--btn-hover-bg': tokens.colors.bgMuted,
  },
  ghost: {
    '--btn-fg': tokens.colors.fg,
    '--btn-hover-bg': tokens.colors.bgMuted,
  },
  danger: {
    '--btn-bg': tokens.colors.danger,
    '--btn-fg': tokens.colors.dangerInk,
    '--btn-border': tokens.colors.danger,
    '--btn-hover-border': tokens.colors.danger,
    '--btn-hover-bg': tokens.colors.bgMuted,
  },
};

const sizes = {
  sm: 'px-4 py-2.5 text-sm min-h-[44px]', // WCAG 2.1 AAA: minimum 44x44px touch target
  md: 'px-5 py-3 text-sm min-h-[44px]', // WCAG 2.1 AAA: minimum 44x44px touch target
  lg: 'px-7 py-4 text-base min-h-[48px]', // Enhanced for primary CTAs
};

/**
 * Button component with variants, sizes, and loading state support
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" loading={isSubmitting}>
 *   Submit
 * </Button>
 *
 * <Button variant="secondary" size="md">
 *   Cancel
 * </Button>
 *
 * <Button variant="danger" loading={isDeleting}>
 *   Delete
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = 'primary', size = 'md', loading, children, style, disabled, ...props },
  ref,
) {
  const cls = [base, variantClasses[variant], sizes[size], className].filter(Boolean).join(' ');
  const isDisabled = disabled || loading;
  const spinnerSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';

  return (
    <button
      ref={ref}
      className={cls}
      style={{ ...variantStyles[variant], ...style }}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size={spinnerSize} aria-label="Loading" />
          <span className="sr-only">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

export type { Props as ButtonProps };
export default Button;
