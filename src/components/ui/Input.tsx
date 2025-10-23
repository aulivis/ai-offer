import * as React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
  help?: string;
  id?: string;
};

export function Input({ error, label, help, id, className, ...props }: Props) {
  const inputId = id || props.name || 'input-' + Math.random().toString(36).slice(2);
  const describedBy = error ? `${inputId}-error` : help ? `${inputId}-help` : undefined;

  return (
    <label htmlFor={inputId} className="block space-y-2">
      {label && <span className="text-sm font-medium text-fg">{label}</span>}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={[
          'w-full rounded-2xl bg-bg text-fg placeholder:text-fg-muted',
          'border border-border px-4 py-2.5',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          className,
        ].join(' ')}
        {...props}
      />
      {help && !error && (
        <span id={`${inputId}-help`} className="text-xs text-fg-muted">{help}</span>
      )}
      {error && (
        <span id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
