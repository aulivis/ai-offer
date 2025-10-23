import * as React from 'react';
import { tokens } from '@/styles/tokens.preset';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

type CSSVarStyle = React.CSSProperties & Record<string, string | undefined>;

const base = [
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

const variantClasses: Record<'primary' | 'secondary' | 'ghost', string> = {
  primary: 'bg-[var(--btn-bg)] text-[var(--btn-fg)] enabled:hover:brightness-110',
  secondary: [
    'border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--btn-fg)]',
    'enabled:hover:border-[var(--btn-hover-border)] enabled:hover:bg-[var(--btn-hover-bg)]',
  ].join(' '),
  ghost: 'bg-transparent text-[var(--btn-fg)] enabled:hover:bg-[var(--btn-hover-bg)]',
};

const variantStyles: Record<'primary' | 'secondary' | 'ghost', CSSVarStyle> = {
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
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  children,
  style,
  ...props
}: Props) {
  const cls = [base, variantClasses[variant], sizes[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={cls}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {loading ? '…' : children}
    </button>
  );
}
