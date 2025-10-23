import * as React from 'react';
import { tokens } from '@/styles/tokens.preset';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

const base =
  'inline-flex items-center justify-center font-semibold transition rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-primary text-primary-ink hover:brightness-110',
  secondary: 'border border-border text-fg hover:border-fg',
  ghost: 'text-fg hover:bg-bg-muted/60',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export function Button({ className, variant = 'primary', size = 'md', loading, children, ...props }: Props) {
  const cls = [base, variants[variant], sizes[size], className].filter(Boolean).join(' ');
  return (
    <button className={cls} {...props}>
      {loading ? '…' : children}
    </button>
  );
}
