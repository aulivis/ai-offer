'use client';

import * as React from 'react';
import { useForm, FormProvider, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { AnimatedError } from '@/components/animations';

type FormProps<T extends FieldValues> = {
  schema?: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: (methods: UseFormReturn<T>) => React.ReactNode;
  className?: string;
};

/**
 * Standard Form component using React Hook Form
 * Provides form state management, validation, and error handling
 *
 * @example
 * ```tsx
 * const schema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * });
 *
 * <Form
 *   schema={schema}
 *   defaultValues={{ email: '', password: '' }}
 *   onSubmit={(data) => console.log(data)}
 * >
 *   {(methods) => (
 *     <>
 *       <FormField name="email" label="Email" />
 *       <FormField name="password" label="Password" type="password" />
 *       <Button type="submit">Submit</Button>
 *     </>
 *   )}
 * </Form>
 * ```
 */
export function Form<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className = '',
}: FormProps<T>) {
  const methods = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: defaultValues as T,
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit} className={className} noValidate>
        {children(methods)}
      </form>
    </FormProvider>
  );
}

type FormFieldProps = {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  help?: string;
  required?: boolean;
  className?: string;
};

/**
 * Form field component that integrates with React Hook Form
 */
export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  error,
  help,
  required,
  className = '',
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const fieldError = error || errors[name]?.message;
  const fieldId = `field-${name}`;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-fg">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={fieldId}
          {...register(name)}
          placeholder={placeholder}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? `${fieldId}-error` : help ? `${fieldId}-help` : undefined}
          className={[
            'w-full rounded-2xl border px-4 py-2.5 text-base',
            'bg-bg text-fg placeholder:text-fg-muted border-border',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            fieldError ? 'border-danger focus:ring-danger' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        />
      ) : (
        <input
          id={fieldId}
          type={type}
          {...register(name)}
          placeholder={placeholder}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? `${fieldId}-error` : help ? `${fieldId}-help` : undefined}
          className={[
            'w-full rounded-2xl border px-4 py-2.5 text-base',
            'bg-bg text-fg placeholder:text-fg-muted border-border',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            fieldError ? 'border-danger focus:ring-danger' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        />
      )}
      {help && !fieldError && (
        <span id={`${fieldId}-help`} className="block text-xs text-fg-muted">
          {help}
        </span>
      )}
      <AnimatedError error={fieldError ? String(fieldError) : null} id={`${fieldId}-error`} />
    </div>
  );
}

// Re-export useFormContext for convenience
export { useFormContext } from 'react-hook-form';
