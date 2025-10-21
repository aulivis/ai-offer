// src/components/ui/Button.tsx
import * as React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'subtle' | 'danger';
};

export function Button({ children, variant = 'primary', className = '', ...rest }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2';
  const map = {
    primary:
      'bg-brand-blue-500 hover:bg-brand-blue-600 text-white shadow-card focus:ring-brand-blue-500 dark:focus:ring-brand-blue-500',
    subtle:
      'bg-slate-100 hover:bg-slate-200 text-ink-900 focus:ring-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:focus:ring-slate-600',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
  } as const;

  return (
    <button className={`${base} ${map[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
