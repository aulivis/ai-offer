import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from './LoadingSpinner';

type FieldMessage = React.ReactNode;

type Props = {
  error?: FieldMessage;
  help?: FieldMessage;
  label?: React.ReactNode;
  id?: string;
  wrapperClassName?: string;
  /** Show loading state (disables select and shows spinner) */
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  name?: string;
  /** For React Hook Form integration */
  register?: ReturnType<typeof import('react-hook-form').useForm>['register'];
};

/**
 * Standard Select component using Radix UI
 * Provides accessible dropdown functionality
 *
 * @example
 * ```tsx
 * <Select
 *   label="Country"
 *   error={errors.country}
 *   help="Select your country"
 *   loading={isLoadingCountries}
 *   placeholder="Select a country..."
 * >
 *   <SelectItem value="us">United States</SelectItem>
 *   <SelectItem value="uk">United Kingdom</SelectItem>
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
  placeholder = 'Select...',
  value,
  onValueChange,
  onChange,
  name,
  register,
}: Props) {
  const selectId = id || name || 'select-' + Math.random().toString(36).slice(2);
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

  // Convert option elements to SelectItem for backward compatibility
  const normalizedChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const optionProps = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
      const keyValue = optionProps.value ?? index;
      return (
        <SelectItem
          key={String(keyValue)}
          value={String(optionProps.value || '')}
          disabled={optionProps.disabled}
        >
          {optionProps.children || optionProps.value}
        </SelectItem>
      );
    }
    return child;
  });

  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
    // Support legacy onChange handler
    if (onChange) {
      const syntheticEvent = {
        target: { value: newValue },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value}
        onValueChange={handleValueChange}
        disabled={isDisabled}
        name={name}
        {...(register ? register(name || '') : {})}
      >
        <SelectPrimitive.Trigger
          id={selectId}
          className={[
            'flex h-11 w-full items-center justify-between rounded-2xl border-2 border-border bg-bg px-4 py-3 text-base',
            'text-fg placeholder:text-fg-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
            'focus:border-primary transition-all duration-200',
            'hover:border-fg/30',
            error ? 'border-danger focus:ring-danger/30 focus:border-danger bg-danger/5' : '',
            loading ? 'pr-10' : '',
            isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-busy={loading}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="text-fg-muted">
            <ChevronDownIcon className="h-4 w-4" />
          </SelectPrimitive.Icon>
          {loading && (
            <div
              id={`${selectId}-loading`}
              className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            >
              <LoadingSpinner size="sm" />
            </div>
          )}
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-2xl border border-border bg-bg shadow-pop">
            <SelectPrimitive.Viewport className="p-1">
              {normalizedChildren}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {help && (
        <span id={`${selectId}-help`} className="block text-xs text-fg-muted">
          {help}
        </span>
      )}
      {error && (
        <span
          id={`${selectId}-error`}
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
    </div>
  );
}

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={[
        'relative flex w-full cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-2 text-sm outline-none',
        'focus:bg-bg-muted focus:text-fg',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = 'SelectItem';
