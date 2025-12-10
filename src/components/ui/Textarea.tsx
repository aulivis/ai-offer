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
            'w-full rounded-2xl border-2 px-4 py-3 text-base',
            'bg-bg text-fg placeholder:text-fg-muted border-border',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
            'focus-visible:border-primary transition-all duration-200',
            'hover:border-fg/30',
            error
              ? 'border-danger focus-visible:ring-danger/30 focus-visible:border-danger bg-danger/5'
              : '',
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
          className="flex items-center gap-1.5 text-xs font-semibold text-danger transition-all duration-300 animate-in slide-in-from-top-1"
          role="alert"
        >
          <svg
            className="h-3.5 w-3.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}
    </label>
  );
}
