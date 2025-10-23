import * as React from 'react';

interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  header?: React.ReactNode;
  as?: React.ElementType;
}

export function Card({ header, className, children, as: Component = 'div', ...props }: CardProps) {
  const cls = [
    'rounded-[16px] border border-border/80 bg-[rgb(var(--color-bg-muted-rgb)/0.96)] p-6 shadow-card transition duration-200 ease-out',
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

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cls = ['mb-4 flex flex-col gap-1', className]
    .filter(Boolean)
    .join(' ');

  return <div className={cls} {...props} />;
}
