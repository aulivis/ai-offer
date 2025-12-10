import * as React from 'react';
import { useId } from 'react';

type FieldMessage = React.ReactNode;

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: FieldMessage;
  label?: React.ReactNode;
  help?: FieldMessage;
  showCounter?: boolean;
  wrapperClassName?: string;
};

export function Textarea({
  error,
  label,
  help,
  showCounter,
  wrapperClassName,
  className,
  ...props
}: Props) {
  const textareaId = useId();
  const describedByIds: string[] = [];

  if (help) {
    describedByIds.push(`${textareaId}-help`);
  }

  if (error) {
    describedByIds.push(`${textareaId}-error`);
  }

  const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;
  const wrapperClasses = wrapperClassName ?? 'flex flex-col gap-2';

  const valueLength = typeof props.value === 'string' ? props.value.length : 0;
  const maxLength = props.maxLength;

  const isRequired =
    props.required || props['aria-required'] === 'true' || props['aria-required'] === true;

  return (
    <label htmlFor={textareaId} className={wrapperClasses}>
      {label && (
        <span className="text-sm font-medium text-fg">
          {label}
          {isRequired && (
            <span className="ml-1 text-danger" aria-label="required">
              *
            </span>
          )}
        </span>
      )}
      <div className="relative">
        <textarea
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={[
            'w-full rounded-2xl border px-4 py-3 text-base',
            'bg-bg text-fg placeholder:text-fg-muted border-border',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            error ? 'border-danger focus-visible:ring-danger' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {showCounter && (
          <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-fg-muted">
            {maxLength ? `${valueLength}/${maxLength}` : valueLength || '0'}
          </span>
        )}
      </div>
      {help && (
        <span id={`${textareaId}-help`} className="block text-xs text-fg-muted">
          {help}
        </span>
      )}
      {error && (
        <span
          id={`${textareaId}-error`}
          className="block text-xs text-danger transition-all duration-200"
          role="alert"
        >
          {error}
        </span>
      )}
    </label>
  );
}
