import * as React from 'react';
import { t } from '@/copy';

type FieldMessage = React.ReactNode;

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  error?: FieldMessage;
  help?: FieldMessage;
  label?: React.ReactNode;
  id?: string;
};

export function Checkbox({ error, help, label, id, className, ...props }: Props) {
  const checkboxId = id || props.name || 'checkbox-' + Math.random().toString(36).slice(2);
  const describedByIds: string[] = [];

  if (help) {
    describedByIds.push(`${checkboxId}-help`);
  }

  if (error) {
    describedByIds.push(`${checkboxId}-error`);
  }

  const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={checkboxId} className="flex items-center gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={[
            'h-5 w-5 rounded border border-border bg-bg text-primary',
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
        <span id={`${checkboxId}-help`} className="block text-xs text-fg-muted">
          {help}
        </span>
      )}
      {error && (
        <span id={`${checkboxId}-error`} className="block text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
