import * as React from 'react';

type FieldMessage = React.ReactNode;

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  error?: FieldMessage;
  help?: FieldMessage;
  label?: React.ReactNode;
  id?: string;
};

export function Radio({ error, help, label, id, className, ...props }: Props) {
  const radioId = id || props.name || 'radio-' + Math.random().toString(36).slice(2);
  const describedByIds: string[] = [];

  if (help) {
    describedByIds.push(`${radioId}-help`);
  }

  if (error) {
    describedByIds.push(`${radioId}-error`);
  }

  const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={radioId} className="flex items-center gap-3">
        <input
          id={radioId}
          type="radio"
          aria-describedby={describedBy}
          className={[
            'h-5 w-5 rounded-full border border-border bg-bg text-primary',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'accent-primary',
            error ? 'border-danger focus-visible:ring-danger' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {label && <span className="text-sm text-fg">{label}</span>}
      </label>
      {help && (
        <span id={`${radioId}-help`} className="block text-xs text-fg-muted">
          {help}
        </span>
      )}
      {error && (
        <span id={`${radioId}-error`} className="block text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
