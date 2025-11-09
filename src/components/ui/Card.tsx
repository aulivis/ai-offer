import * as React from 'react';
import { t } from '@/copy';

interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Card header content */
  header?: React.ReactNode;
  /** HTML element or component to render as */
  as?: React.ElementType;
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
  /** Card style variant */
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
}

const sizeClasses = {
  sm: 'p-4 rounded-xl',
  md: 'p-6 rounded-2xl',
  lg: 'p-8 rounded-3xl',
};

const variantClasses = {
  default: 'border border-border/80 bg-[rgb(var(--color-bg-muted-rgb)/0.96)] shadow-card',
  elevated: 'border border-border/60 bg-[rgb(var(--color-bg-muted-rgb)/0.98)] shadow-pop',
  outlined: 'border-2 border-border bg-transparent shadow-none',
  flat: 'border-0 bg-[rgb(var(--color-bg-muted-rgb)/0.96)] shadow-none',
};

/**
 * Card component with size and variant options
 * 
 * @example
 * ```tsx
 * <Card size="md" variant="default">
 *   <CardHeader>
 *     <h3>Title</h3>
 *   </CardHeader>
 *   <CardBody>
 *     Content
 *   </CardBody>
 *   <CardFooter>
 *     Actions
 *   </CardFooter>
 * </Card>
 * ```
 */
export function Card({
  header,
  className,
  children,
  as: Component = 'div',
  size = 'md',
  variant = 'default',
  ...props
}: CardProps) {
  const cls = [
    sizeClasses[size],
    variantClasses[variant],
    'transition duration-200 ease-out',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={cls} {...props}>
      {header}
      {children}
    </Component>
  );
}

/**
 * Card header component
 */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cls = ['mb-4 flex flex-col gap-1', className].filter(Boolean).join(' ');

  return <div className={cls} {...props} />;
}

/**
 * Card body component
 */
export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cls = ['flex flex-col gap-4', className].filter(Boolean).join(' ');

  return <div className={cls} {...props} />;
}

/**
 * Card footer component
 */
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cls = ['mt-4 flex items-center gap-2 pt-4 border-t border-border/60', className].filter(Boolean).join(' ');

  return <div className={cls} {...props} />;
}
