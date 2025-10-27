import * as React from 'react';
import { t } from '@/copy';

type FieldMessage = React.ReactNode;

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: FieldMessage;
  help?: FieldMessage;
  label?: React.ReactNode;
  id?: string;
  wrapperClassName?: string;
};

export function Select({
  error,
  help,
  label,
  id,
  className,
  children,
  wrapperClassName,
  ...props
}: Props) {
  const selectId = id || props.name || 'select-' + Math.random().toString(36).slice(2);
  const describedByIds: string[] = [];

  if (help) {
    describedByIds.push(`${selectId}-help`);
  }

  if (error) {
    describedByIds.push(`${selectId}-error`);
  }

  const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

  const wrapperClasses = wrapperClassName ?? 'flex flex-col gap-2';

  return (
    <label htmlFor={selectId} className={wrapperClasses}>
      {label && <span className="text-sm font-medium text-fg">{label}</span>}
      <select
        id={selectId}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={[
          'w-full rounded-2xl border px-4 py-2.5 text-base',
          'bg-bg text-fg placeholder:text-fg-muted border-border',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          error ? 'border-danger focus-visible:ring-danger' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </select>
      {help && (
        <span id={`${selectId}-help`} className="block text-xs text-fg-muted">
          {help}
        </span>
      )}
      {error && (
        <span id={`${selectId}-error`} className="block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
