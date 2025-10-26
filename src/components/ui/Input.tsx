import * as React from 'react';
import { useId } from 'react';

type FieldMessage = React.ReactNode;

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: FieldMessage;
  label?: React.ReactNode;
  help?: FieldMessage;
  id?: string;
  wrapperClassName?: string;
};

export function Input({ error, label, help, id, className, wrapperClassName, ...props }: Props) {
  const inputId = useId();
  const describedByIds: string[] = [];

  if (help) {
    describedByIds.push(`${inputId}-help`);
  }

  if (error) {
    describedByIds.push(`${inputId}-error`);
  }

  const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

  const wrapperClasses = wrapperClassName ?? 'flex flex-col gap-2';

  return (
    <label htmlFor={inputId} className={wrapperClasses}>
      {label && <span className="text-sm font-medium text-fg">{label}</span>}
      <input
        id={inputId}
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
      />
      {help && (
        <span id={`${inputId}-help`} className="block text-xs text-fg-muted">
          {help}
        </span>
      )}
      {error && (
        <span id={`${inputId}-error`} className="block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
