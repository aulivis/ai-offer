import * as React from 'react';
import { t } from '@/copy';
import { LoadingSpinner } from './LoadingSpinner';

type FieldMessage = React.ReactNode;

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: FieldMessage;
  help?: FieldMessage;
  label?: React.ReactNode;
  id?: string;
  wrapperClassName?: string;
  /** Show loading state (disables select and shows spinner) */
  loading?: boolean;
};

/**
 * Select component with error handling, help text, and loading state support
 * 
 * @example
 * ```tsx
 * <Select
 *   label="Country"
 *   error={errors.country}
 *   help="Select your country"
 *   loading={isLoadingCountries}
 * >
 *   <option value="">Select...</option>
 *   <option value="us">United States</option>
 * </Select>
 * ```
 */
export function Select({
  error,
  help,
  label,
  id,
  className,
  children,
  wrapperClassName,
  loading,
  disabled,
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

  if (loading) {
    describedByIds.push(`${selectId}-loading`);
  }

  const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

  const wrapperClasses = wrapperClassName ?? 'flex flex-col gap-2';
  const isDisabled = disabled || loading;

  return (
    <label htmlFor={selectId} className={wrapperClasses}>
      {label && <span className="text-sm font-medium text-fg">{label}</span>}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-busy={loading}
          disabled={isDisabled}
          className={[
            'w-full rounded-2xl border px-4 py-2.5 text-base',
            'bg-bg text-fg placeholder:text-fg-muted border-border',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            error ? 'border-danger focus-visible:ring-danger' : '',
            loading ? 'pr-10' : '',
            isDisabled ? 'cursor-not-allowed opacity-60' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {children}
        </select>
        {loading && (
          <div 
            id={`${selectId}-loading`}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          >
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
      {help && (
        <span id={`${selectId}-help`} className="block text-xs text-fg-muted">
          {help}
        </span>
      )}
      {error && (
        <span id={`${selectId}-error`} className="block text-xs text-danger" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
