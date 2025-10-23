import * as React from 'react';

type FieldMessage = React.ReactNode;

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  error?: FieldMessage;
  help?: FieldMessage;
  label?: React.ReactNode;
  id?: string;
  description?: React.ReactNode;
};

export function Switch({ error, help, label, description, id, className, ...props }: Props) {
  const switchId = id || props.name || 'switch-' + Math.random().toString(36).slice(2);
  const describedByIds: string[] = [];

  if (description) {
    describedByIds.push(`${switchId}-description`);
  }

  if (help) {
    describedByIds.push(`${switchId}-help`);
  }

  if (error) {
    describedByIds.push(`${switchId}-error`);
  }

  const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-fg">{label}</span>}
          {description && (
            <span id={`${switchId}-description`} className="text-xs text-fg-muted">
              {description}
            </span>
          )}
        </div>
        <label htmlFor={switchId} className="relative inline-flex h-7 w-12 cursor-pointer items-center">
          <input
            id={switchId}
            type="checkbox"
            role="switch"
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={[
              'peer sr-only',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
          <span
            className={[
              'h-full w-full rounded-full border border-border bg-bg transition-colors',
              'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary',
              'peer-checked:bg-primary',
              error ? 'border-danger peer-focus-visible:ring-danger' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
          <span
            className={[
              'absolute left-1 top-1 h-5 w-5 rounded-full bg-fg transition-transform',
              'peer-checked:translate-x-5 peer-checked:bg-primary-ink',
            ].join(' ')}
          />
        </label>
      </div>
      {help && (
        <span id={`${switchId}-help`} className="block text-xs text-fg-muted">
          {help}
        </span>
      )}
      {error && (
        <span id={`${switchId}-error`} className="block text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
